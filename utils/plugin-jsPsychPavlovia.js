/**
 * jsPsych plugin (version > 7.0) for pavlovia.org
 *
 * This plugin handles communications with the pavlovia.org server: it opens and closes sessions,
 * and uploads data to the server.
 *
 * @author Alain Pitiot
 * @version 2022.1.1
 * @copyright (c) 2017-2020 Ilixa Ltd. (http://ilixa.com) (c) 2020-2021 Open Science Tools Ltd.
 *   (https://opensciencetools.org)
 * @license Distributed under the terms of the MIT License
 */

 var jsPsychPavlovia = (function (jsPsych)
 {
     "use strict";

     /**
      * **pavlovia**
      *
      * This plugin handles communications with the pavlovia.org server: it opens and closes sessions,
      * and uploads data to the server.
      *
      * @author Alain Pitiot
      * @see {@link https://pavlovia.org/docs/experiments/create-jsPsych Running jsPsych experiments from Pavlovia}
      */
     class PavloviaPlugin
     {
         constructor(jsPsych)
         {
             this._jsPsych = jsPsych;
         }

         /**
          * Run the plugin.
          *
          * @param {HTMLElement} display_element - the HTML DOM element where jsPsych content
          * 	is rendered
          * @param {Object} trial - the jsPsych trial
          * @public
          */
         async trial(display_element, trial)
         {
             // execute the command:
             switch (trial.command.toLowerCase())
             {
                 case "init":
                     await this._init(trial);
                     break;

                 case "finish":
                     const data = this._jsPsych.data.get().csv();
                     await this._finish(trial, data);
                     break;

                 default:
                     trial.errorCallback("unknown command: " + trial.command);
             }

             // end trial
             this._jsPsych.finishTrial();
         }

         /**
          * The default error callback function.
          *
          * Error messages are displayed in the body of the document and in the browser's console.
          *
          * @param {Object} error - the error json object to be displayed.
          * @public
          */
         static defaultErrorCallback(error)
         {
             // output the error to the console:
             console.error("[pavlovia " + PavloviaPlugin.version + "]", error);

             // output the error to the html body:
             let htmlCode = '<h3>[jspsych-pavlovia plugin ' + PavloviaPlugin.version + '] Error</h3><ul>';
             while (true) {
                 if (typeof error === 'object' && 'context' in error) {
                     htmlCode += '<li>' + error.context + '</li>';
                     error = error.error;
                 } else {
                     htmlCode += '<li><b>' + error  + '</b></li>';
                     break;
                 }
             }
             htmlCode += '</ul>';
             document.querySelector('body').innerHTML = htmlCode;
         }

         /**
          * The default data filter, applied to the data gathered by jsPsych, before they are
          * uploaded to the server.
          *
          * The filter typically prunes and reformat jsPsych.data.get().csv().
          *
          * @param {Object} data - input data, typically from jsPsych.data.get().csv()
          * @returns filtered data, ready for upload to the server
          * @public
          */
         static defaultDataFilter(data)
         {
             return data;
         }

         /**
          * Initialise the connection with pavlovia.org: configure the plugin and open a new session.
          *
          * @param {Object} trial - the jsPsych trial
          * @param {string} [configURL= "config.json"] - the URL of the pavlovia.org json configuration file
          * @returns {Promise<void>}
          * @private
          */
         async _init(trial, configURL = 'config.json')
         {
             try
             {
                 // configure:
                 let response = await this._configure(configURL);
                 PavloviaPlugin._config = response.config;
                 this._log('init | _configure.response=', response);

                 // open a new session:
                 response = await this._openSession();
                 // _config.experiment.token = response.token;
                 this._log('init | _openSession.response=', response);

                 // warn the user when they attempt to close the tab or browser:
                 const _beforeunloadCallback = (event) =>
                 {
                     // preventDefault should ensure that the user gets prompted:
                     event.preventDefault();

                     // Chrome requires returnValue to be set:
                     event.returnValue = '';
                 };
                 window.addEventListener('beforeunload', _beforeunloadCallback);


                 // when the user closes the tab or browser, we attempt to close the session
                 // and optionally save the results
                 // note: we communicate with the server using the Beacon API
                 window.addEventListener('unload', (event) =>
                 {
                     if (PavloviaPlugin._config.session.status === 'OPEN')
                     {
                         // get and save the incomplete results if need be:
                         if (PavloviaPlugin._config.experiment.saveIncompleteResults)
                         {
                             const data = this._jsPsych.data.get().csv();
                             this._save(trial, data, true);
                         }

                         // close the session:
                         this._closeSession(false, true);
                     }
                 });
             }
             catch (error)
             {
                 trial.errorCallback(error);
             }
         }


         /**
          * Finish the connection with pavlovia.org: upload the collected data and close the session.
          *
          * @param {Object} trial - the jsPsych trial
          * @param {Object} data - the experiment data to be uploaded
          * @returns {Promise<void>}
          * @private
          */
         async _finish(trial, data)
         {
             try
             {
                 // remove the beforeunload listener:
                 window.removeEventListener('beforeunload', PavloviaPlugin._beforeunloadCallback);

                 // tell the participant that the data is being uploaded:
                 const msg = "Please wait a moment while the data are uploaded to the pavlovia.org server...";
                 const displayElement = this._jsPsych.getDisplayElement();
                 displayElement.innerHTML = '<pre id="pavlovia-data-upload"></pre>';
                 document.getElementById('pavlovia-data-upload').textContent = msg;

                 // upload the data to pavlovia.org:
                 const sync = (typeof trial.sync !== 'undefined') ? trial.sync : false;
                 let response = await this._save(trial, data, sync);
                 this._log('finish | _save.response=', response);

                 // check for errors:
                 if (('serverData' in response) && ('error' in response.serverData))
                 {
                     throw response.serverData;
                 }

                 // close the session:
                 response = await this._closeSession(true, false);
                 this._log('finish | _closeSession.response=', response);
             }
             catch (error)
             {
                 trial.errorCallback(error);
             }
         }

         /**
          * Configure the plugin by reading the configuration file created upon activation
          * of the experiment.
          *
          * @param {string} [configURL= "config.json"] - the URL of the pavlovia.org json
          * 	configuration file
          * @returns {Promise<any>}
          * @private
          */
         async _configure(configURL)
         {
             let response = {
                 origin: '_configure',
                 context: 'when configuring the plugin'
             };

             try
             {
                 const configurationResponse = await this._getConfiguration(configURL);

                 // legacy experiments had a psychoJsManager block instead of a pavlovia block, and the URL
                 // pointed to https://pavlovia.org/server
                 if ('psychoJsManager' in configurationResponse.config)
                 {
                     delete configurationResponse.config.psychoJsManager;
                     configurationResponse.config.pavlovia = {
                         URL: 'https://pavlovia.org'
                     };
                 }

                 // tests for the presence of essential blocks in the configuration:
                 if (!('experiment' in configurationResponse.config))
                 {
                     throw 'missing experiment block in configuration';
                 }
                 if (!('name' in configurationResponse.config.experiment))
                 {
                     throw 'missing name in experiment block in configuration';
                 }
                 if (!('fullpath' in configurationResponse.config.experiment))
                 {
                     throw 'missing fullpath in experiment block in configuration';
                 }
                 if (!('pavlovia' in configurationResponse.config))
                 {
                     throw 'missing pavlovia block in configuration';
                 }
                 if (!('URL' in configurationResponse.config.pavlovia))
                 {
                     throw 'missing URL in pavlovia block in configuration';
                 }

                 // get the server parameters (those starting with a double underscore):
                 const urlQuery = window.location.search.slice(1);
                 const urlParameters = new URLSearchParams(urlQuery);
                 urlParameters.forEach((value, key) =>
                 {
                     if (key.indexOf('__') === 0)
                     {
                         PavloviaPlugin._serverMsg.set(key, value);
                     }
                 });

                 return configurationResponse;
             }
             catch (error)
             {
                 throw { ...response, error };
             }
         }

         /**
          * Get the pavlovia.org json configuration file.
          *
          * @param {string} configURL - the URL of the pavlovia.org json configuration file
          * @returns {Promise<any>}
          * @private
          */
         _getConfiguration(configURL)
         {
             let response = {
                 origin: '_getConfiguration',
                 context: 'when reading the configuration file: ' + configURL
             };

             return new Promise(async (resolve, reject) =>
             {
                 try
                 {
                     // query the pavlovia server:
                     const serverResponse = await fetch(configURL, {
                         method: "GET",
                         mode: "cors",
                         cache: "no-cache",
                         credentials: "same-origin",
                         headers: {
                       'Content-Type': 'application/json'
                     },
                         redirect: "follow",
                         referrerPolicy: "no-referrer"
                     });
                     const serverData = await serverResponse.json();

                     resolve({ ...response, config: serverData });
                 }
                 catch (error)
                 {
                     console.error(error);
                     reject({ ...response, error });
                 }
             });
         }

         /**
          * Open a new session for this experiment on pavlovia.org.
          *
          * @returns {Promise<any>}
          * @private
          */
         _openSession()
         {
             let response = {
                 origin: '_openSession',
                 context: 'when opening a session for experiment: ' + PavloviaPlugin._config.experiment.fullpath
             };

             // prepare a POST query:
             const formData = new FormData();
             if (PavloviaPlugin._serverMsg.has('__pilotToken'))
             {
                 formData.append('pilotToken', PavloviaPlugin._serverMsg.get('__pilotToken'));
             }

             // query pavlovia server:
             return new Promise(async (resolve, reject) =>
             {
                 const url = `${PavloviaPlugin._config.pavlovia.URL}/api/v2/experiments/${PavloviaPlugin._config.gitlab.projectId}/sessions`;
                 try
                 {
                     // query the pavlovia server:
                     const serverResponse = await fetch(url, {
                         method: "POST",
                         mode: "cors",
                         cache: "no-cache",
                         credentials: "same-origin",
                         headers: {
                             'Content-Type': 'application/json'
                         },
                         redirect: "follow",
                         referrerPolicy: "no-referrer",
                         body: formData
                     });
                     const serverData = await serverResponse.json();

                     // check for required attributes:
                     if (!('token' in serverData))
                     {
                         reject(Object.assign(response, { error: 'unexpected answer from server: no token'}));
                     }
                     if (!('experiment' in serverData))
                     {
                         reject(Object.assign(response, { error: 'unexpected answer from server: no experiment'}));
                     }

                     // update the configuration:
                     PavloviaPlugin._config.session = { token: serverData.token, status: 'OPEN' };
                     PavloviaPlugin._config.experiment.status = serverData.experiment.status2;
                     PavloviaPlugin._config.experiment.saveFormat = Symbol.for(serverData.experiment.saveFormat);
                     PavloviaPlugin._config.experiment.saveIncompleteResults = serverData.experiment.saveIncompleteResults;
                     PavloviaPlugin._config.experiment.license = serverData.experiment.license;
                     PavloviaPlugin._config.runMode = serverData.experiment.runMode;

                     resolve( Object.assign(response, {
                         token: serverData.token,
                         status: serverData.experiment.status2
                     }) );
                 }
                 catch (error)
                 {
                     console.error(error);
                     reject({ ...response, error });
                 }

             });

         }

         /**
          * Close the previously opened session on pavlovia.org.
          *
          * @param {boolean} isCompleted - whether or not the participant completed the experiment
          * @param {boolean} [sync = false] - whether or not to use the Beacon API to communicate
          * 	with the server
          * @private
          */
         _closeSession(isCompleted = true, sync = false)
         {
             let response = {
                 origin: '_closeSession',
                 context: 'when closing the session for experiment: ' + PavloviaPlugin._config.experiment.fullpath
             };

             // prepare a DELETE query:
             const url = PavloviaPlugin._config.pavlovia.URL + '/api/v2/experiments/' + PavloviaPlugin._config.gitlab.projectId + '/sessions/' + PavloviaPlugin._config.session.token;
             const formData = new FormData();
             formData.append('isCompleted', isCompleted);

             // synchronously query the pavlovia server:
             if (sync)
             {
                 navigator.sendBeacon(url + '/delete', formData);
                 PavloviaPlugin._config.session.status = 'CLOSED';
             }
             else
             {
                 // asynchronously query the pavlovia server:
                 return new Promise(async (resolve, reject) =>
                 {
                     try
                     {
                         // query the pavlovia server:
                         const serverResponse = await fetch(url, {
                             method: "DELETE",
                             mode: "cors",
                             cache: "no-cache",
                             credentials: "same-origin",
                             redirect: "follow",
                             referrerPolicy: "no-referrer",
                             body: formData
                         });
                         const serverData = await serverResponse.json();

                         PavloviaPlugin._config.session.status = 'CLOSED';
                         resolve( Object.assign(response, { serverData }) );
                     }
                     catch (error)
                     {
                         console.error(error);
                         reject({ ...response, error });
                     }

                 });
             }
         }

         /**
          * Upload data to the pavlovia.org server.
          *
          * @param {Object} trial - the jsPsych trial
          * @param {string} data - the experiment data to be uploaded
          * @param {boolean} [sync = false] - whether or not to use the Beacon API to communicate
          * 	with the server
          * @return {Promise<any>}
          * @private
          */
         async _save(trial, data, sync = false)
         {
             const date = new Date();
             let dateString = date.getFullYear() + '-' + ('0'+(1+date.getMonth())).slice(-2) + '-' + ('0'+date.getDate()).slice(-2) + '_';
             dateString += ('0'+date.getHours()).slice(-2) + 'h' + ('0'+date.getMinutes()).slice(-2) + '.' + ('0'+date.getSeconds()).slice(-2) + '.' + date.getMilliseconds();

             const key = PavloviaPlugin._config.experiment.name + '_' + trial.participantId + '_' + 'SESSION' + '_' + dateString + '.csv';
             const filteredData = trial.dataFilter(data);

             if (PavloviaPlugin._config.experiment.status === 'RUNNING' && !PavloviaPlugin._serverMsg.has('__pilotToken'))
             {
                 return await this._uploadData(key, filteredData, sync);
             }
             else
             {
                 this._offerDataForDownload(key, filteredData, 'text/csv');
                 return {
                     origin: '_save',
                     context: 'when saving results for experiment: ' + PavloviaPlugin._config.experiment.fullpath,
                     message: 'offered the .csv file for download'
                 };
             }
         }

         /**
          * Upload data (a key/value pair) to pavlovia.org.
          *
          * @param {string} key - the key
          * @param {string} value - the value
          * @param {boolean} [sync = false] - whether or not to upload the data using the Beacon API
          * @returns {Promise<any>}
          * @private
          */
         _uploadData(key, value, sync = false)
         {
             let response = {
                 origin: '_uploadData',
                 context: 'when uploading participant\' results for experiment: ' + PavloviaPlugin._config.experiment.fullpath
             };

             const url = PavloviaPlugin._config.pavlovia.URL + '/api/v2/experiments/' + PavloviaPlugin._config.gitlab.projectId + '/sessions/' + PavloviaPlugin._config.session.token + '/results';

             const formData = new FormData();
             formData.append('key', key);
             formData.append('value', value);

             // synchronous query the pavlovia server:
             if (sync)
             {
                 navigator.sendBeacon(url, formData);
             }
             // asynchronously query the pavlovia server:
             else
             {
                 return new Promise(async (resolve, reject) =>
                 {
                     try
                     {
                         const serverResponse = await fetch(url, {
                             method: "POST",
                             mode: "cors",
                             cache: "no-cache",
                             credentials: "same-origin",
                             redirect: "follow",
                             referrerPolicy: "no-referrer",
                             body: formData
                         });
                         const serverData = await serverResponse.json();

                         resolve(Object.assign(response, { serverData }));
                     }
                     catch (error)
                     {
                         console.error(error);
                         reject({ ...response, error });
                     }

                 });
             }
         }

         /**
          * Log messages to the browser's console.
          *
          * @param {...*} messages - the messages to be displayed in the browser's console
          * @private
          */
         _log(...messages)
         {
             console.log('[pavlovia ' + PavloviaPlugin.version + ']', ...messages);
         }

         /**
          * Offer data as download in the browser.
          *
          * @param {string} filename - the name of the file to be downloaded
          * @param {*} data - the data
          * @param {string} type - the MIME type of the data, e.g. 'text/csv' or 'application/json'
          * @private
          */
         _offerDataForDownload(filename, data, type)
         {
             const blob = new Blob([data], { type });

             if (window.navigator.msSaveOrOpenBlob)
             {
                 window.navigator.msSaveBlob(blob, filename);
             }
             else
             {
                 const elem = window.document.createElement('a');
                 elem.href = window.URL.createObjectURL(blob);
                 elem.download = filename;
                 document.body.appendChild(elem);
                 elem.click();
                 document.body.removeChild(elem);
             }
         }

     }

     /**
      * Plugin version:
      * @public
      */
     PavloviaPlugin.version = "2022.1.1";

     /**
      * The pavlovia.org configuration (usually read from the config.json configuration file).
      *
      * @type {Object}
      * @private
      */
     PavloviaPlugin._config = {};

     /**
      * The callback for the beforeunload event, which is triggered when the participant
      * tries to leave the experiment by closing the tab or browser.
      *
      * @type {null}
      * @private
      */
     PavloviaPlugin._beforeunloadCallback = null;

     /**
      * The server parameters (those starting with a double underscore).
      *
      * @type {Object}
      * @private
      */
     PavloviaPlugin._serverMsg = new Map();

     /**
      * Plugin information.
      * @public
      */
     PavloviaPlugin.info = {
         name: "pavlovia",
         description: 'communication with pavlovia.org',
         parameters: {
             command: {
                 type: jsPsych.ParameterType.STRING,
                 pretty_name: 'Command',
                 default: 'init',
                 description: 'The pavlovia command: "init" (default) or "finish"'
             },
             participantId: {
                 type: jsPsych.ParameterType.STRING,
                 pretty_name: 'Participant Id',
                 default: 'PARTICIPANT',
                 description: 'The participant Id: "PARTICIPANT" (default) or any string'
             },
             errorCallback: {
                 type: jsPsych.ParameterType.FUNCTION,
                 pretty_name: 'ErrorCallback',
                 default: PavloviaPlugin.defaultErrorCallback,
                 description: 'The callback function called whenever an error has occurred'
             },
             dataFilter: {
                 type: jsPsych.ParameterType.FUNCTION,
                 pretty_name: 'DataFilter',
                 default: PavloviaPlugin.defaultDataFilter,
                 description: 'The filter applied to the data gathered by jsPsych before upload to the server'
             }
         }
     };

     return PavloviaPlugin;

 })(jsPsychModule);
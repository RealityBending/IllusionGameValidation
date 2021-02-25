/* SAVING DATA FUNCTION ================== */

// Authenticate github using Octokit (https://octokit.github.io/rest.js/v18/)
// import { Octokit } from "https://cdn.skypack.dev/@octokit/rest"

// returns Octokit authentication promise
/* const authenticatedOctokit =
    fetch(".netlify/functions/api") // fetching gh token from netlify server function
        .then(response => response.json())
        .then((json) =>
            new Octokit({
                auth: json.auth, // authenticating Octokit
            })
        )
*/
// Commit info
// const REPO_NAME = "IllusionGame"
// const REPO_OWNER = "RealityBending" // update this to use "RealityBending"
// const AUTHOR_EMAIL = "dom.makowski@gmail.com" // update this to committer/author email

/* function commitToRepo(jsonData, path) {
    // commits a new file in defined repo
    authenticatedOctokit
        .then(octokit => { // "then" makes sure that this runs *after* octokit is authenticated
            octokit.repos.createOrUpdateFileContents({
                owner: REPO_OWNER,
                repo: REPO_NAME,
                path: `${path}`, // path in repo -- saves to 'results' folder as '<participant_id>.json'
                message: `Saving ${path}`, // commit message
                content: btoa(jsonData), // octokit requires base64 encoding for the content; this just encodes the json string
                "committer.name": REPO_OWNER,
                "committer.email": AUTHOR_EMAIL,
                "author.name": REPO_OWNER,
                "author.email": AUTHOR_EMAIL,
            })
        })
}
*/


/* ----------------- Initialize Variables ----------------- */
// Get participant and session info
var subject_id = jsPsych.randomization.randomID(15) /* random subject ID with 15 characters */
var datetime = new Date()
var timezone = -1 * (datetime.getTimezoneOffset() / 60)
var date = format_digit(datetime.getFullYear()) + format_digit(datetime.getMonth() + 1) + format_digit(datetime.getDate())
var time = format_digit(datetime.getHours()) + format_digit(datetime.getMinutes()) + format_digit(datetime.getSeconds())
var participant_id = date + "_" + time + "_" + jsPsych.randomization.randomID(5)  // generate a random subject ID with 15 characters
var time_start = performance.now()

var session_info = {
    participant_id: participant_id,
    experiment_version: '0.0.1',
    datetime: datetime.toLocaleDateString("fr-FR") + " " + datetime.toLocaleTimeString("fr-FR"),
    date: date,
    time: time,
    date_timezone: timezone
}

// Set experiment variables
var trial_number = 1 // trial indexing variable starts at 1 for convenience
var block_number = 0 // block indexing variables (should block 0 be there as practice block?)
var images = ['stimuli/delboeuf_str0_diff1.png', 'stimuli/delboeuf_str0_diff-1.png', 'stimuli/delboeuf_str1_diff1.png', 'stimuli/delboeuf_str1_diff-1.png',
              'stimuli/delboeuf_str-1_diff1.png', 'stimuli/delboeuf_str-1_diff-1.png', 'stimuli/ebbinghaus_str0_diff1.png', 'stimuli/ebbinghaus_str0_diff-1.png',
              'stimuli/ebbinghaus_str1_diff1.png', 'stimuli/ebbinghaus_str1_diff-1.png', 'stimuli/ebbinghaus_str-1_diff1.png', 'stimuli/ebbinghaus_str-1_diff-1.png'] // preload images

// fixed scores as placeholders, update later
var population_scores = {
    delboeuf_accuracy: 90,
    delboeuf_sd: 10,
    ebbinghaus_accuracy: 100,
    ebbinghaus_sd: 20
}

// Welcome + Informed Consent
var welcome = {
    type: "html-button-response",
    choices: ["I want to participate.", "I don't want to participate."],
    stimulus: "Welcome to the experiment. (Some informed consent)",
    on_finish: function (data) {  // end experiment if 'I don't want to participate' was chosen
        if (data.response == 1) {
            jsPsych.endExperiment('The experiment has ended.')
        }
    },
    data: Object.assign({ screen: 'session_info' }, session_info, systemInfo())
}

/* jsPsych.data.addProperties({  // add these variables to all rows of datafile
    subject: subject_id,
    datetime: datetime,
}); */

// Get self-reported participant info
var participant_info_general = {
    type: 'survey-text',
    questions: [
        { prompt: "Enter your birthday", name: 'Age', placeholder: "example: '13121991' for 13/12/1991" },
        { prompt: "Enter your initials", name: 'Initials', placeholder: "example: 'DM'" }
    ],
    data: { screen: 'participant_info_general' }
}

// Get info on repetition
var participant_info_repetition = {
    type: 'survey-multi-choice',
    questions: [
        {
            prompt: "<p><b>Have you played this before?</b></p>" +
                "<p><i>This is important for us to know to study the effect of repetition!</i></p>",
            name: 'AlreadyPlayed',
            options: ["No", "Yes"],
            required: true
        }
    ],
    data: { screen: 'participant_info_repetition' }
}

// Set fixation cross
var fixation = {
    type: 'html-keyboard-response',
    stimulus: '<div style="font-size:60px;">+</div>',
    choices: jsPsych.NO_KEYS, /* no responses will be accepted as a valid response */
    trial_duration: function () { return randomInteger(250, 750) },
    /* trial_duration: function(){
    return jsPsych.randomization.sampleWithoutReplacement([250, 500, 750, 1000], 1)[0];
    }, */
    data: { screen: 'fixation' }
}

/* ----------------- BLOCK 1: DELBOEUF ILLUSION ----------------- */
// Instructions
var delboeuf_instructions = {
    type: "html-button-response",
    choices: ["Start"],
    stimulus: function () {
        if (systemInfo().screen_touchscreen == false) {
            return ("<p>In this experiment, two red circles will appear " +
                "on the screen.</p><p>Your task is to judge which circle is bigger in size. </p><p>If the <strong>left circle</strong> is bigger, " +
                "press the <strong>left arrow key</strong> on the keyboard as fast as you can.</p>" +
                "<p>If the <strong>right circle</strong> is bigger, press the <strong>right arrow key</strong> as fast as you can.</p><hr>" +
                "<div style='float: center'><img src='demo_stimuli/Delboeuf_Demo.png' height='300'></img>" +
                "<p class='small'>For example, <strong>press the left arrow key</strong> here.</p></div>")
        } else {
            return ("<p>In this experiment, two red circles will appear " +
                "on the screen.</p><p>Your task is to judge which circle is bigger in size. </p><p>If the <strong>left circle</strong> is bigger, " +
                "<strong>click on the left circle</strong> as fast as you can.</p>" +
                "<p>If the <strong>right circle</strong> is bigger, <strong>click on the right circle</strong> as fast as you can.</p><hr>" +
                "<div style='float: center'><img src='demo_stimuli/Delboeuf_Demo.png' height='300'></img>" +
                "<p class='small'>For example, <strong>click on the left circle</strong> here.</p></div>")
        }
    },
    post_trial_gap: 2000,
    on_finish: function (data) {
        block_number += 1
    }
}

// Set stimuli
var delboeuf_stimuli = [
    { stimulus: "stimuli/delboeuf_str0_diff1.png", data: { screen: 'test', block: 'delboeuf', correct_response: 'arrowleft' } },
    { stimulus: "stimuli/delboeuf_str0_diff-1.png", data: { screen: 'test', block: 'delboeuf', correct_response: 'arrowright' } },
    { stimulus: "stimuli/delboeuf_str1_diff1.png", data: { screen: 'test', block: 'delboeuf', correct_response: 'arrowleft' } },
    { stimulus: "stimuli/delboeuf_str1_diff-1.png", data: { screen: 'test', block: 'delboeuf', correct_response: 'arrowright' } },
    { stimulus: "stimuli/delboeuf_str-1_diff1.png", data: { screen: 'test', block: 'delboeuf', correct_response: 'arrowleft' } },
    { stimulus: "stimuli/delboeuf_str-1_diff-1.png", data: { screen: 'test', block: 'delboeuf', correct_response: 'arrowright' } }
]


// Set test trials
var delboeuf_test = {
    type: "image-keyboardmouse-response",
    stimulus: jsPsych.timelineVariable('stimulus'),
    choices: ['arrowleft', 'arrowright'],
    data: jsPsych.timelineVariable('data'),
    on_finish: function (data) {
        data.prestimulus_duration = jsPsych.data.get().last(2).values()[0].time_elapsed - jsPsych.data.get().last(3).values()[0].time_elapsed
        // Score the response as correct or incorrect.
        if (data.response != -1) {
            if (jsPsych.pluginAPI.compareKeys(data.response, data.correct_response)) {
                data.correct = true
            } else {
                data.correct = false
            }
        } else {
            // code mouse clicks as correct or wrong
            if (data.click_x < window.innerWidth / 2) { // use window.innerHeight for up vs down presses
                data.response = 'arrowleft'
            } else {
                data.response = 'arrowright'
            }
            if (jsPsych.pluginAPI.compareKeys(data.response, data.correct_response)) {
                data.correct = true
            } else {
                data.correct = false
            }
        }
        // track block and trial numbers
        data.block_number = block_number
        data.trial_number = trial_number
        trial_number += 1
    },
}

// link variables in stimuli array with the call to jsPsych.timelineVariable()
var test_delboeuf_procedure = {
    timeline: [fixation, delboeuf_test],
    timeline_variables: delboeuf_stimuli,
    randomize_order: true,
    repetitions: 1
}

// Debriefing Information
var delboeuf_debrief = {
    type: "html-button-response",
    choices: ["Next Illusion"],
    stimulus: function () {

        var trials = jsPsych.data.get().filter({ screen: 'test', block: 'delboeuf'})
        var correct_trials = trials.filter({ correct: true })
        var proportion_correct = correct_trials.count() / trials.count()
        if (correct_trials.count() > 0) {
            var rt = correct_trials.select('rt').mean()
            // compute inverse efficiency score
            var ies = rt / proportion_correct
        } else {
            var rt = ""
            var ies = ""
        }
        return "<p>Here are your results:</p><hr>" +
            ies +
            "<hr><p>Can you do better in the next illusion?</p>"
    }
}

/* ----------------- BLOCK 2: EBBINGHAUS ILLUSION ----------------- */
// Instructions
var ebbinghaus_instructions = {
    type: "html-button-response",
    choices: ["Start"],
    stimulus: function () {
        if (systemInfo().screen_touchscreen == false) {
            return ("<p>In this experiment, two red circles will appear " +
                "on the screen.</p><p>Your task is to judge which circle is bigger in size. </p><p>If the <strong>left circle</strong> is bigger, " +
                "press the <strong>left arrow key</strong> on the keyboard as fast as you can.</p>" +
                "<p>If the <strong>right circle</strong> is bigger, press the <strong>right arrow key</strong> as fast as you can.</p><hr>" +
                "<div style='float: center'><img src='demo_stimuli/Ebbinghaus_Demo.png' height='300'></img>" +
                "<p class='small'>For example, <strong>press the left arrow key</strong> here.</p></div>")
        } else {
            return ("<p>In this experiment, two red circles will appear " +
                "on the screen.</p><p>Your task is to judge which circle is bigger in size. </p><p>If the <strong>left circle</strong> is bigger, " +
                "<strong>click on the left circle</strong> as fast as you can.</p>" +
                "<p>If the <strong>right circle</strong> is bigger, <strong>click on the right circle</strong> as fast as you can.</p><hr>" +
                "<div style='float: center'><img src='demo_stimuli/Ebbinghaus_Demo.png' height='300'></img>" +
                "<p class='small'>For example, <strong>click on the left circle</strong> here.</p></div>")
        }
    },
    post_trial_gap: 2000,
    on_finish: function (data) {
        trial_number = 1  // reset trial number for next block
        block_number += 1
    }
}

// Set stimuli
var ebbinghaus_stimuli = [
    { stimulus: "stimuli/ebbinghaus_str0_diff1.png", data: { screen: 'test', block: 'ebbinghaus', correct_response: 'arrowleft' } },
    { stimulus: "stimuli/ebbinghaus_str0_diff-1.png", data: { screen: 'test', block: 'ebbinghaus', correct_response: 'arrowright' } },
    { stimulus: "stimuli/ebbinghaus_str1_diff1.png", data: { screen: 'test', block: 'ebbinghaus', correct_response: 'arrowleft' } },
    { stimulus: "stimuli/ebbinghaus_str1_diff-1.png", data: { screen: 'test', block: 'ebbinghaus', correct_response: 'arrowright' } },
    { stimulus: "stimuli/ebbinghaus_str-1_diff1.png", data: { screen: 'test', block: 'ebbinghaus', correct_response: 'arrowleft' } },
    { stimulus: "stimuli/ebbinghaus_str-1_diff-1.png", data: { screen: 'test', block: 'ebbinghaus', correct_response: 'arrowright' } }
]

// Set test trials
var ebbinghaus_test = {
    type: "image-keyboardmouse-response",
    stimulus: jsPsych.timelineVariable('stimulus'),
    choices: ['arrowleft', 'arrowright'],
    data: jsPsych.timelineVariable('data'),
    on_finish: function (data) {
        data.prestimulus_duration = jsPsych.data.get().last(2).values()[0].time_elapsed - jsPsych.data.get().last(3).values()[0].time_elapsed
        // Score the response as correct or incorrect.
        if (data.response != -1) {
            if (jsPsych.pluginAPI.compareKeys(data.response, data.correct_response)) {
                data.correct = true
            } else {
                data.correct = false
            }
        } else {
            // code mouse clicks as correct or wrong
            if (data.click_x < window.innerWidth / 2) { // use window.innerHeight for up vs down presses
                data.response = 'arrowleft'
            } else {
                data.response = 'arrowright'
            }
            if (jsPsych.pluginAPI.compareKeys(data.response, data.correct_response)) {
                data.correct = true
            } else {
                data.correct = false
            }
        }
        // track block and trial numbers
        data.block_number = block_number
        data.trial_number = trial_number
        trial_number += 1
    },
}

// link variables in stimuli array with the call to jsPsych.timelineVariable()
var test_ebbinghaus_procedure = {
    timeline: [fixation, ebbinghaus_test],
    timeline_variables: ebbinghaus_stimuli,
    randomize_order: true,
    repetitions: 1
}

// Debriefing Information
var ebbinghaus_debrief = {
    type: "html-button-response",
    choices: ["Next Illusion"],
    stimulus: function () {

        var trials = jsPsych.data.get().filter({ screen: 'test', block: 'ebbinghaus'})
        var correct_trials = trials.filter({ correct: true })
        var accuracy = "<p style='color:rgb(76,175,80);'>You responded correctly on <b>" +
            round_digits(correct_trials.count() / trials.count() * 100) + "" +
            "%</b> of the trials.</p>"
        if (correct_trials.count() > 0) {
            var rt = correct_trials.select('rt').mean()
            rt = "<p style='color:rgb(233,30,99);'>Your average response time was <b>" + round_digits(rt) + "</b> ms.</p>"
        } else {
            var rt = ""
        }
        return "<p>Here are your results:</p><hr>" +
            accuracy + rt +
            "<hr><p>Can you do better in the next illusion?</p>"
    }
}

/* ----------------- END OF EXPERIMENT ----------------- */
// Debriefing Information
var end_experiment = {
    type: "html-button-response",
    choices: ["End"],
    stimulus: function () {

        var trials = jsPsych.data.get().filter({ screen: 'test' })
        var correct_trials = trials.filter({ correct: true })
        var accuracy = "<p style='color:rgb(76,175,80);'>You responded correctly on <b>" +
            round_digits(correct_trials.count() / trials.count() * 100) + "" +
            "%</b> of the trials.</p>"
        if (correct_trials.count() > 0) {
            var rt = correct_trials.select('rt').mean()
            rt = "<p style='color:rgb(233,30,99);'>Your average response time was <b>" + round_digits(rt) + "</b> ms.</p>"
        } else {
            var rt = ""
        }
        return "<p><b>Thank you for participating!</b> Here are your results:</p><hr>" +
            accuracy + rt +
            "<hr><p> Don't hesitate to spread the word and share this experiment, science appreciates :)</p>"
    },
    /* var accuracy = Math.round(correct_trials.count() / trials.count() * 100);
    var rt = Math.round(correct_trials.select('rt').mean());

    return "<p>You responded correctly on "+accuracy+"% of the trials.</p>"+
    "<p>Your average response time was "+rt+"ms.</p>"+
    "<p>Press any key to complete the experiment. Thank you!</p>";
    },*/
    on_finish: function () {
        jsPsych.endExperiment('The experiment has ended. You can close the window or press refresh it to start again.')
    }
}


/* ----------------- Initialize experiment ----------------- */
jsPsych.init({
    timeline: [welcome, participant_info_general, participant_info_repetition, delboeuf_instructions, test_delboeuf_procedure, delboeuf_debrief,
        ebbinghaus_instructions, test_ebbinghaus_procedure, ebbinghaus_debrief, end_experiment],
    show_progress_bar: true,
    message_progress_bar: 'Completion',
    preload_images: images,
    // exclusions: { min_width: 800, min_height: 600 }, /* exclude browsers that are not at least 800x600 pix */
    on_interaction_data_update: function (data) { console.log(JSON.stringify(data)) }, /* record browser interactions */
    on_finish: function () {
        jsPsych.data.displayData()
    }
})


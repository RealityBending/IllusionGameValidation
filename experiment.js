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

/* ----------------- Internal Functions ----------------- */
function get_results(illusion_mean, illusion_sd, illusion_type) {
    if (typeof illusion_type != 'undefined') {
        var trials = jsPsych.data.get().filter({ screen: 'test', block: illusion_type }) // results by block
    } else {
        var trials = jsPsych.data.get().filter({ screen: 'test' }) // overall results
    }
    var correct_trials = trials.filter({ correct: true })
    var proportion_correct = correct_trials.count() / trials.count()
    var rt_mean = trials.select('rt').mean()
    if (correct_trials.count() > 0) {
        var rt_mean_correct = correct_trials.select('rt').mean()
        var ies = rt_mean_correct / proportion_correct // compute inverse efficiency score
        var percentile = 100 - (cumulative_probability(ies, illusion_mean, illusion_sd) * 100)
    } else {
        var rt_mean_correct = ""
        var ies = ""
        var percentile = ""
    }
    return {
        accuracy: proportion_correct,
        mean_reaction_time: rt_mean,
        mean_reaction_time_correct: rt_mean_correct,
        inverse_efficiency: ies,
        percentage: percentile,
    }
}

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

// fixed scores as placeholders, update later
const delboeuf_mean = 550
const delboeuf_sd = 10
const ebbinghaus_mean = 660
const ebbinghaus_sd = 20
const mullerlyer_mean = 660
const mullerlyer_sd = 20
const ponzo_mean = 660
const ponzo_sd = 20
const overall_mean = 590
const overall_sd = 25

// Welcome + Informed Consent
var welcome = {
    type: "html-button-response",
    choices: ["I want to play!", "Nah, I hate science."],
    stimulus: "<p><b>The Illusion Game</b></p>" +
        "<p>By playing this game, you are also contributing to science, as it was designed by psychologists studying illusions. " +
        "Therefore, please note that some data from your session will be recorded, such as speed and errors. " +
        "<b>Don't worry though, it's entirely anonymous!</b></p>" +
        "<p>By participating, you agree on letting us use this data to study the psychology of illusions.</p>" +
        "<p><sub>Please contact (dom.makowski@gmail) for any inquiries.</sub></p>",
    on_finish: function (data) {  // end experiment if 'I don't want to participate' was chosen
        if (data.response == 1) {
            jsPsych.endExperiment("You're free to leave!")
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

// Get info on repetition (and show general instructions if not familiar)
var participant_info_repetition = {
    type: 'survey-multi-choice',
    questions: [
        {
            prompt: "<p><b>Are you familiar with this game?</b></p>",
            options: ["Yes, let me play!", "No, what do I need to do?"],
            required: true
        }
    ],
    data: { screen: 'participant_info_repetition' }
}

var general_instructions = {
    type: "html-button-response",
    choices: ["Let's play!"],
    stimulus: "<p><b>The Illusion Game</b></p>" +
        "<p>In this game, you will see several visual illusions.</p>" +
        "<p>Visual illusions are visually perceived images that are deceptive or misleading because of their context. </p>" +
        "<p>For example, one circle may appear large than another because of its surrounding context. </p>" +
        "<p>In each block of illusions, you will have to make judgements of <b>size/length/colour contrast</b>.</p>" +
        "<p>Your goal is to be as <b>accurate</b> and as <b>fast</b> as possible!</p>",
    data: { screen: 'participant_info_newsubject' }
}

var if_not_repeated = {
    timeline: [general_instructions],
    conditional_function: function () {
        var data = jsPsych.data.getLastTrialData().values()[0]
        if (data.response.Q0 == "No, what do I need to do?") {
            return true
        } else {
            return false
        }
    },
    data: { screen: 'participant_info_newsubject' }
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

// prepare trigger for fullscreen mode
var fullscreen = {
    type: 'fullscreen',
    fullscreen_mode: true
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
                "<div style='float: center'><img src='utils/Delboeuf_Demo.png' height='300'></img>" +
                "<p><img src='utils/answer/answer_leftright_keyboard.PNG' height='150'></img></p>" +
                "<p class='small'>For example, <strong>press the left arrow key</strong> here.</p></div>")
        } else {
            return ("<p>In this experiment, two red circles will appear " +
                "on the screen.</p><p>Your task is to judge which circle is bigger in size. </p><p>If the <strong>left circle</strong> is bigger, " +
                "<strong>click on the left circle</strong> as fast as you can.</p>" +
                "<p>If the <strong>right circle</strong> is bigger, <strong>click on the right circle</strong> as fast as you can.</p><hr>" +
                "<div style='float: center'><img src='utils/Delboeuf_Demo.png' height='300'></img>" +
                "<p><img src='utils/answer/answer_leftright_touch.PNG' height='150'></img></p>" +
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
    { stimulus: "stimuli/Delboeuf_str0.33_diff0.33.png", data: { screen: 'test', block: 'delboeuf', correct_response: 'arrowleft' } },
    { stimulus: "stimuli/Delboeuf_str0.33_diff-0.33.png", data: { screen: 'test', block: 'delboeuf', correct_response: 'arrowright' } },
    { stimulus: "stimuli/Delboeuf_str-0.33_diff0.33.png", data: { screen: 'test', block: 'delboeuf', correct_response: 'arrowleft' } },
    { stimulus: "stimuli/Delboeuf_str-0.33_diff-0.33.png", data: { screen: 'test', block: 'delboeuf', correct_response: 'arrowright' } },
]

// Preload images
var delboeuf_preload = {
    type: 'preload',
    trials: delboeuf_stimuli // automatically preload just the images from block_1 trials
}

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
        data.block = 'delboeuf'
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
        var results = get_results(delboeuf_mean, delboeuf_sd, 'delboeuf')
        var display_accuracy = "<p style='color:rgb(76,175,80);'>You responded correctly on <b>" +
            round_digits(results.accuracy * 100) + "" + "%</b> of the trials.</p>"
        var display_rt = "<p style='color:rgb(233,30,99);'>Your average response time was <b>" + round_digits(results.mean_reaction_time) + "</b> ms.</p>"
        var display_percentile = round_digits(results.percentage)
        var comparison = "<p style='color:rgb(233,30,99);'>You performed better than <b>" + display_percentile + "</b>% of the population.</p>"
        return "<p>Here are your results:</p><hr>" +
            comparison +
            "<hr><p>Can you do better in the next illusion?</p>"
    },
    on_finish: function (data) {
        var results = get_results(delboeuf_mean, delboeuf_sd, 'delboeuf')
        data.block = 'delboeuf'
        data.block_number = block_number
        data.rt_mean = results.mean_reaction_time
        data.rt_mean_correct = results.mean_reaction_time_correct
        data.accuracy = results.accuracy
        data.inverse_efficiency_score = results.inverse_efficiency
    },
    data: { screen: 'block_results' }
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
                "<div style='float: center'><img src='utils/Ebbinghaus_Demo.png' height='300'></img>" +
                "<p><img src='utils/answer/answer_leftright_keyboard.PNG' height='150'></img></p>" +
                "<p class='small'>For example, <strong>press the left arrow key</strong> here.</p></div>")
        } else {
            return ("<p>In this experiment, two red circles will appear " +
                "on the screen.</p><p>Your task is to judge which circle is bigger in size. </p><p>If the <strong>left circle</strong> is bigger, " +
                "<strong>click on the left circle</strong> as fast as you can.</p>" +
                "<p>If the <strong>right circle</strong> is bigger, <strong>click on the right circle</strong> as fast as you can.</p><hr>" +
                "<div style='float: center'><img src='utils/Ebbinghaus_Demo.png' height='300'></img>" +
                "<p><img src='utils/answer/answer_leftright_touch.PNG' height='150'></img></p>" +
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
    { stimulus: "stimuli/Ebbinghaus_str0.33_diff0.33.png", data: { screen: 'test', block: 'ebbinghaus', correct_response: 'arrowleft' } },
    { stimulus: "stimuli/Ebbinghaus_str0.33_diff-0.33.png", data: { screen: 'test', block: 'ebbinghaus', correct_response: 'arrowright' } },
    { stimulus: "stimuli/Ebbinghaus_str-0.33_diff0.33.png", data: { screen: 'test', block: 'ebbinghaus', correct_response: 'arrowleft' } },
    { stimulus: "stimuli/Ebbinghaus_str-0.33_diff-0.33.png", data: { screen: 'test', block: 'ebbinghaus', correct_response: 'arrowright' } },
]

// Preload images
var ebbinghaus_preload = {
    type: 'preload',
    trials: ebbinghaus_stimuli // automatically preload just the images from block_2 trials
}

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
        data.block = 'ebbinghaus'
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
        var results = get_results(ebbinghaus_mean, ebbinghaus_sd, 'ebbinghaus')
        var display_accuracy = "<p style='color:rgb(76,175,80);'>You responded correctly on <b>" +
            round_digits(results.accuracy * 100) + "" + "%</b> of the trials.</p>"
        var display_rt = "<p style='color:rgb(233,30,99);'>Your average response time was <b>" + round_digits(results.mean_reaction_time) + "</b> ms.</p>"
        var display_percentile = round_digits(results.percentage)
        var comparison = "<p style='color:rgb(233,30,99);'>You performed better than <b>" + display_percentile + "</b>% of the population.</p>"
        return "<p>Here are your results:</p><hr>" +
            comparison +
            "<hr><p>Can you do better in the next illusion?</p>"
    },
    on_finish: function (data) {
        var results = get_results(ebbinghaus_mean, ebbinghaus_sd, 'ebbinghaus')
        data.block = 'ebbinghaus'
        data.block_number = block_number
        data.rt_mean = results.mean_reaction_time
        data.rt_mean_correct = results.mean_reaction_time_correct
        data.accuracy = results.accuracy
        data.inverse_efficiency_score = results.inverse_efficiency
    },
    data: { screen: 'block_results' }
}


/* ----------------- BLOCK 3: MULLERLYER ILLUSION ----------------- */
// Instructions
var mullerlyer_instructions = {
    type: "html-button-response",
    choices: ["Start"],
    stimulus: function () {
        if (systemInfo().screen_touchscreen == false) {
            return ("<p>In this experiment, two red lines will appear " +
                "on the screen.</p><p>Your task is to judge which line is longer. </p><p>If the <strong>upper horizontal line</strong> is longer, " +
                "press the <strong>up arrow key</strong> on the keyboard as fast as you can.</p>" +
                "<p>If the <strong>lower horizontal line</strong> is longer, press the <strong>down arrow key</strong> as fast as you can.</p><hr>" +
                "<div style='float: center'><img src='utils/MullerLyer_Demo.png' height='300'></img>" +
                "<p><img src='utils/answer/answer_leftright_keyboard.PNG' height='150'></img></p>" +
                "<p class='small'>For example, <strong>press the up arrow key</strong> here.</p></div>")
        } else {
            return ("<p>In this experiment, two red lines will appear " +
                "on the screen.</p><p>Your task is to judge which line is longer. </p><p>If the <strong>upper horizontal line</strong> is longer, " +
                "<strong>click on the upper line</strong> as fast as you can.</p>" +
                "<p>If the <strong>lower horizontal line</strong> is longer, <strong>click on the lower line</strong> as fast as you can.</p><hr>" +
                "<div style='float: center'><img src='utils/MullerLyer_Demo.png' height='300'></img>" +
                "<p><img src='utils/answer/answer_leftright_touch.PNG' height='150'></img></p>" +
                "<p class='small'>For example, <strong>click on the upper line</strong> here.</p></div>")
        }
    },
    post_trial_gap: 2000,
    on_finish: function (data) {
        trial_number = 1  // reset trial number for next block
        block_number += 1
    }
}

// Set stimuli
var mullerlyer_stimuli = [
    { stimulus: "stimuli/MullerLyer_str16.67_diff0.1.png", data: { screen: 'test', block: 'mullerlyer', correct_response: 'arrowup' } },
    { stimulus: "stimuli/MullerLyer_str16.67_diff-0.1.png", data: { screen: 'test', block: 'mullerlyer', correct_response: 'arrowdown' } },
    { stimulus: "stimuli/MullerLyer_str50.0_diff0.1.png", data: { screen: 'test', block: 'mullerlyer', correct_response: 'arrowup' } },
    { stimulus: "stimuli/MullerLyer_str50.0_diff-0.1.png", data: { screen: 'test', block: 'mullerlyer', correct_response: 'arrowdown' } },
]

// Preload images
var mullerlyer_preload = {
    type: 'preload',
    trials: mullerlyer_stimuli // automatically preload just the images from block_3 trials
}

// Set test trials
var mullerlyer_test = {
    type: "image-keyboardmouse-response",
    stimulus: jsPsych.timelineVariable('stimulus'),
    choices: ['arrowup', 'arrowdown'],
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
            if (data.click_x < window.innerHeight / 2) { // use window.innerHeight for up vs down presses
                data.response = 'arrowdown'
            } else {
                data.response = 'arrowup'
            }
            if (jsPsych.pluginAPI.compareKeys(data.response, data.correct_response)) {
                data.correct = true
            } else {
                data.correct = false
            }
        }
        // track block and trial numbers
        data.block = 'mullerlyer'
        data.block_number = block_number
        data.trial_number = trial_number
        trial_number += 1
    },
}

// link variables in stimuli array with the call to jsPsych.timelineVariable()
var test_mullerlyer_procedure = {
    timeline: [fixation, mullerlyer_test],
    timeline_variables: mullerlyer_stimuli,
    randomize_order: true,
    repetitions: 1
}

// Debriefing Information
var mullerlyer_debrief = {
    type: "html-button-response",
    choices: ["Next Illusion"],
    stimulus: function () {
        var results = get_results(mullerlyer_mean, mullerlyer_sd, 'mullerlyer')
        var display_accuracy = "<p style='color:rgb(76,175,80);'>You responded correctly on <b>" +
            round_digits(results.accuracy * 100) + "" + "%</b> of the trials.</p>"
        var display_rt = "<p style='color:rgb(233,30,99);'>Your average response time was <b>" + round_digits(results.mean_reaction_time) + "</b> ms.</p>"
        var display_percentile = round_digits(results.percentage)
        var comparison = "<p style='color:rgb(233,30,99);'>You performed better than <b>" + display_percentile + "</b>% of the population.</p>"
        return "<p>Here are your results:</p><hr>" +
            comparison +
            "<hr><p>Can you do better in the next illusion?</p>"
    },
    on_finish: function (data) {
        var results = get_results(mullerlyer_mean, mullerlyer_sd, 'mullerlyer')
        data.block = 'mullerlyer'
        data.block_number = block_number
        data.rt_mean = results.mean_reaction_time
        data.rt_mean_correct = results.mean_reaction_time_correct
        data.accuracy = results.accuracy
        data.inverse_efficiency_score = results.inverse_efficiency
    },
    data: { screen: 'block_results' }
}


/* ----------------- BLOCK 4: PONZO ILLUSION ----------------- */
// Instructions
var ponzo_instructions = {
    type: "html-button-response",
    choices: ["Start"],
    stimulus: function () {
        if (systemInfo().screen_touchscreen == false) {
            return ("<p>In this experiment, two red lines will appear " +
                "on the screen.</p><p>Your task is to judge which line is longer. </p><p>If the <strong>upper horizontal line</strong> is longer, " +
                "press the <strong>up arrow key</strong> on the keyboard as fast as you can.</p>" +
                "<p>If the <strong>lower horizontal line</strong> is longer, press the <strong>down arrow key</strong> as fast as you can.</p><hr>" +
                "<div style='float: center'><img src='utils/Ponzo_Demo.png' height='300'></img>" +
                "<p><img src='utils/answer/answer_leftright_keyboard.PNG' height='150'></img></p>" +
                "<p class='small'>For example, <strong>press the up arrow key</strong> here.</p></div>")
        } else {
            return ("<p>In this experiment, two red lines will appear " +
                "on the screen.</p><p>Your task is to judge which line is longer. </p><p>If the <strong>upper horizontal line</strong> is longer, " +
                "<strong>click on the upper line</strong> as fast as you can.</p>" +
                "<p>If the <strong>lower horizontal line</strong> is longer, <strong>click on the lower line</strong> as fast as you can.</p><hr>" +
                "<div style='float: center'><img src='utils/Ponzo_Demo.png' height='300'></img>" +
                "<p><img src='utils/answer/answer_leftright_touch.PNG' height='150'></img></p>" +
                "<p class='small'>For example, <strong>click on the upper line</strong> here.</p></div>")
        }
    },
    post_trial_gap: 2000,
    on_finish: function (data) {
        trial_number = 1  // reset trial number for next block
        block_number += 1
    }
}

// Set stimuli
var ponzo_stimuli = [
    { stimulus: "stimuli/Ponzo_str-6.67_diff0.3.png", data: { screen: 'test', block: 'ponzo', correct_response: 'arrowup' } },
    { stimulus: "stimuli/Ponzo_str-6.67_diff-0.3.png", data: { screen: 'test', block: 'ponzo', correct_response: 'arrowdown' } },
    { stimulus: "stimuli/Ponzo_str-20.0_diff0.3.png", data: { screen: 'test', block: 'ponzo', correct_response: 'arrowup' } },
    { stimulus: "stimuli/Ponzo_str-20.0_diff-0.3.png", data: { screen: 'test', block: 'ponzo', correct_response: 'arrowdown' } },
]

// Preload images
var ponzo_preload = {
    type: 'preload',
    trials: ponzo_stimuli // automatically preload just the images from block_3 trials
}

// Set test trials
var ponzo_test = {
    type: "image-keyboardmouse-response",
    stimulus: jsPsych.timelineVariable('stimulus'),
    choices: ['arrowup', 'arrowdown'],
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
            if (data.click_x < window.innerHeight / 2) { // use window.innerHeight for up vs down presses
                data.response = 'arrowdown'
            } else {
                data.response = 'arrowup'
            }
            if (jsPsych.pluginAPI.compareKeys(data.response, data.correct_response)) {
                data.correct = true
            } else {
                data.correct = false
            }
        }
        // track block and trial numbers
        data.block = 'ponzo'
        data.block_number = block_number
        data.trial_number = trial_number
        trial_number += 1
    },
}

// link variables in stimuli array with the call to jsPsych.timelineVariable()
var test_ponzo_procedure = {
    timeline: [fixation, ponzo_test],
    timeline_variables: ponzo_stimuli,
    randomize_order: true,
    repetitions: 1
}

// Debriefing Information
var ponzo_debrief = {
    type: "html-button-response",
    choices: ["Next Illusion"],
    stimulus: function () {
        var results = get_results(ponzo_mean, ponzo_sd, 'ponzo')
        var display_accuracy = "<p style='color:rgb(76,175,80);'>You responded correctly on <b>" +
            round_digits(results.accuracy * 100) + "" + "%</b> of the trials.</p>"
        var display_rt = "<p style='color:rgb(233,30,99);'>Your average response time was <b>" + round_digits(results.mean_reaction_time) + "</b> ms.</p>"
        var display_percentile = round_digits(results.percentage)
        var comparison = "<p style='color:rgb(233,30,99);'>You performed better than <b>" + display_percentile + "</b>% of the population.</p>"
        return "<p>Here are your results:</p><hr>" +
            comparison +
            "<hr><p>Can you do better in the next illusion?</p>"
    },
    on_finish: function (data) {
        var results = get_results(ponzo_mean, ponzo_sd, 'ponzo')
        data.block = 'ponzo'
        data.block_number = block_number
        data.rt_mean = results.mean_reaction_time
        data.rt_mean_correct = results.mean_reaction_time_correct
        data.accuracy = results.accuracy
        data.inverse_efficiency_score = results.inverse_efficiency
    },
    data: { screen: 'block_results' }
}


/* ----------------- END OF EXPERIMENT ----------------- */
// Debriefing Information
var end_experiment = {
    type: "html-button-response",
    choices: ["End"],
    stimulus: function () {
        var results = get_results(overall_mean, overall_sd)
        var display_accuracy = "<p style='color:rgb(76,175,80);'>You responded correctly on <b>" +
            round_digits(results.accuracy * 100) + "" + "%</b> of the trials.</p>"
        var display_rt = "<p style='color:rgb(233,30,99);'>Your average response time was <b>" + round_digits(results.mean_reaction_time) + "</b> ms.</p>"
        var display_percentile = round_digits(results.percentage)
        var comparison = "<p style='color:rgb(233,30,99);'>You performed better than <b>" + display_percentile + "</b>% of the population.</p>"
        return "<p><b>Thank you for participating!</b> Here are your results:</p><hr>" +
            comparison +
            "<hr><p> Don't hesitate to spread the word and share this experiment, science appreciates :)</p>"
    },
    on_finish: function (data) {
        jsPsych.endExperiment('The experiment has ended. You can close the window or press refresh it to start again.')
        var results = get_results(overall_mean, overall_sd)
        data.rt_mean = results.mean_reaction_time
        data.rt_mean_correct = results.mean_reaction_time_correct
        data.accuracy = results.accuracy
        data.inverse_efficiency_score = results.inverse_efficiency
    },
    data: { screen: 'final_results' }
}


/* ----------------- Initialize experiment ----------------- */
jsPsych.init({
    timeline: [fullscreen, welcome, participant_info_general, participant_info_repetition, if_not_repeated,
        delboeuf_preload, delboeuf_instructions, test_delboeuf_procedure, delboeuf_debrief,
        ebbinghaus_preload, ebbinghaus_instructions, test_ebbinghaus_procedure, ebbinghaus_debrief,
        mullerlyer_preload, mullerlyer_instructions, test_mullerlyer_procedure, mullerlyer_debrief,
        ponzo_preload, ponzo_instructions, test_ponzo_procedure, ponzo_debrief,
        end_experiment],
    show_progress_bar: true,
    message_progress_bar: 'Completion',
    // exclusions: { min_width: 800, min_height: 600 }, /* exclude browsers that are not at least 800x600 pix */
    on_interaction_data_update: function (data) { console.log(JSON.stringify(data)) }, /* record browser interactions */
    on_finish: function () {
        jsPsych.data.displayData()
    }
})


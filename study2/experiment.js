/* ----------------- Internal Functions ----------------- */
function get_results(illusion_mean, illusion_sd, illusion_type) {
    if (typeof illusion_type != "undefined") {
        var trials = jsPsych.data
            .get()
            .filter({ screen: "Trial", type: illusion_type }) // results by block
    } else {
        var trials = jsPsych.data.get().filter({ screen: "Trial" }) // overall results
    }
    var correct_trials = trials.filter({ correct: true })
    var proportion_correct = correct_trials.count() / trials.count()
    var rt_mean = trials.select("rt").mean()
    if (correct_trials.count() > 0) {
        var rt_mean_correct = correct_trials.select("rt").mean()
        var ies = rt_mean_correct / proportion_correct // compute inverse efficiency score
        var score_to_display = 100 - ies / 50
        if (score_to_display < 0) {
            score_to_display = 0
        }
        var percentile =
            100 - cumulative_probability(ies, illusion_mean, illusion_sd) * 100
    } else {
        var rt_mean_correct = ""
        var ies = ""
        var percentile = 0
        var score_to_display = 0
    }
    return {
        accuracy: proportion_correct,
        mean_reaction_time: rt_mean,
        mean_reaction_time_correct: rt_mean_correct,
        inverse_efficiency: ies,
        percentage: percentile,
        score: score_to_display,
    }
}

function get_debrief_display(results, type = "Block") {
    if (type === "Block") {
        // Debrief at end of each block
        var score =
            "<p>Your score for this illusion is " +
            '<p style="color: black; font-size: 48px; font-weight: bold;">' +
            Math.round(results.score*10)/10 +
            " %</p>"
    } else if (type === "Final") {
        // Final debriefing at end of game
        var score =
            "<p><strong>Your final score is</strong> " +
            '<p style="color: black; font-size: 48px; font-weight: bold;">&#127881; ' +
            Math.round(results.score) +
            " &#127881;</p>"
    }

    return {
        display_score: score,
        display_accuracy:
            "<p style='color:rgb(76,175,80);'>You responded correctly on <b>" +
            round_digits(results.accuracy * 100) +
            "" +
            "%</b> of the trials.</p>",
        display_rt:
            "<p style='color:rgb(233,30,99);'>Your average response time was <b>" +
            round_digits(results.mean_reaction_time) +
            "</b> ms.</p>",
        display_comparison:
            "<p style='color:rgb(76,175,80);'>You performed better than <b>" +
            round_digits(results.percentage) +
            "</b>% of the population.</p>",
    }
}

// Set fixation cross
var fixation = {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: '<div style="font-size:60px;">+</div>',
    choices: "NO_KEYS" /* no responses will be accepted as a valid response */,
    //trial_duration: 0, // (for testing)
    trial_duration: function () {
        return randomInteger(500, 1000) // Function from RealityBending/JSmisc
    },
    save_trial_parameters: {
        trial_duration: true,
    },
    data: { screen: "fixation" },
}

// Break
var make_break = {
    type: jsPsychHtmlButtonResponse,
    choices: ["I am ready to continue!"],
    stimulus:
        "<p><b>CONGRATULATIONS!</b></p>" +
        "<p>You have finished half of the game. We know it's long and challenging, so we appreciate you staying focused until the end!</p>" +
        "<p>You will now see all the illusions once again. <b>Try to beat your previous score!</b></p>",
    save_trial_parameters: {
        trial_duration: true,
    },
    data: { screen: "break" },
}

// Marker
var marker_position = [0, 0, 0, 0] // [0, 0, 100, 100]
function create_marker(marker_position, color = "black") {
    const html = `<div id="marker" style="position: absolute; background-color: ${color};\
    left:${marker_position[0]}; top:${marker_position[1]}; \
    width:${marker_position[2]}px; height:${marker_position[3]}px";></div>`
    document.querySelector("body").insertAdjacentHTML("beforeend", html)
}

// Trial
function create_trial(illusion_name = "Ponzo", type = "updown") {
    if (type == "updown") {
        var trial = {
            type: jsPsychImageKeyboardResponse,
            stimulus: jsPsych.timelineVariable("stimulus"),
            choices: ["arrowup", "arrowdown"],
            data: jsPsych.timelineVariable("data"),
            on_load: function () {
                create_marker(marker_position)
            },
            on_finish: function (data) {
                document.querySelector("#marker").remove()
                data.prestimulus_duration =
                    jsPsych.data.get().last(2).values()[0].time_elapsed -
                    jsPsych.data.get().last(3).values()[0].time_elapsed
                // Score the response as correct or incorrect.
                if (data.response != -1) {
                    if (
                        jsPsych.pluginAPI.compareKeys(
                            data.response,
                            data.correct_response
                        )
                    ) {
                        data.correct = true
                    } else {
                        data.correct = false
                    }
                } else {
                    // code mouse clicks as correct or wrong
                    if (data.click_x < window.innerHeight / 2) {
                        // use window.innerHeight for up vs down presses
                        data.response = "arrowdown"
                    } else {
                        data.response = "arrowup"
                    }
                    if (
                        jsPsych.pluginAPI.compareKeys(
                            data.response,
                            data.correct_response
                        )
                    ) {
                        data.correct = true
                    } else {
                        data.correct = false
                    }
                }
                // track block and trial numbers
                data.type = illusion_name
                data.illusion_strength =
                    jsPsych.timelineVariable("Illusion_Strength")
                data.illusion_difference =
                    jsPsych.timelineVariable("Difference")
                data.block_number = block_number
                data.trial_number = trial_number
                trial_number += 1
            },
        }
    } else {
        var trial = {
            type: jsPsychImageKeyboardResponse,
            stimulus: jsPsych.timelineVariable("stimulus"),
            choices: ["arrowleft", "arrowright"],
            data: jsPsych.timelineVariable("data"),
            on_load: function () {
                create_marker(marker_position)
            },
            on_finish: function (data) {
                document.querySelector("#marker").remove()
                data.prestimulus_duration =
                    jsPsych.data.get().last(2).values()[0].time_elapsed -
                    jsPsych.data.get().last(3).values()[0].time_elapsed
                // Score the response as correct or incorrect.
                if (data.response != -1) {
                    if (
                        jsPsych.pluginAPI.compareKeys(
                            data.response,
                            data.correct_response
                        )
                    ) {
                        data.correct = true
                    } else {
                        data.correct = false
                    }
                } else {
                    // code mouse clicks as correct or wrong
                    if (data.click_x < window.innerWidth / 2) {
                        // use window.innerHeight for up vs down presses
                        data.response = "arrowleft"
                    } else {
                        data.response = "arrowright"
                    }
                    if (
                        jsPsych.pluginAPI.compareKeys(
                            data.response,
                            data.correct_response
                        )
                    ) {
                        data.correct = true
                    } else {
                        data.correct = false
                    }
                }
                // track block and trial numbers
                data.type = illusion_name
                data.illusion_strength =
                    jsPsych.timelineVariable("Illusion_Strength")
                data.illusion_difference =
                    jsPsych.timelineVariable("Difference")
                data.block_number = block_number
                data.trial_number = trial_number
                trial_number += 1
            },
        }
    }
    return trial
}

// Debrief
function create_debrief(illusion_name = "Ponzo") {
    var debrief = {
        type: jsPsychHtmlButtonResponse,
        choices: ["Continue"],
        on_start: function () {
            ;(document.body.style.cursor = "auto"),
                (document.querySelector(
                    "#jspsych-progressbar-container"
                ).style.display = "inline")
        },
        stimulus: function () {
            var results = get_results(
                1000, // population_scores[illusion_name]["IES_Mean"][0],
                400, // population_scores[illusion_name]["IES_SD"][0],
                illusion_name
            )
            var show_screen = get_debrief_display(results)
            return (
                show_screen.display_score +
                // "<hr>" +
                // // For debugging purposes, show the raw data.
                // show_screen.display_accuracy +
                // "<hr>" +
                // show_screen.display_rt +
                // "<hr>" +
                // //
                // show_screen.display_comparison +
                "<hr><p>Can you do better in the next illusion?</p>"
            )
        },
        data: { screen: "block_results" },
        // Reset trial number and update block number
        on_finish: function () {
            block_number += 1
            trial_number = 1
        },
    }
    return debrief
}

// Debrief
function make_trial(stimuli, instructions, illusion_name, type) {
    var timeline = []

    // Set stimuli (var stimuli is loaded in stimuli/stimuli.js)
    var stim_list = stimuli.filter(
        (stimuli) => stimuli.Illusion_Type === illusion_name
    )

    // Preload images
    timeline.push({
        type: jsPsychPreload,
        images: stim_list.map((a) => a.stimulus),
    })

    // Instructions
    timeline.push({
        type: jsPsychHtmlKeyboardResponse,
        on_start: function () {
            ;(document.body.style.cursor = "none"),
                (document.querySelector(
                    "#jspsych-progressbar-container"
                ).style.display = "none")
        },
        choices: ["enter"],
        stimulus: instructions,
        post_trial_gap: 500,
    })

    // Define trial
    var trial = create_trial(illusion_name, (type = type))

    // Create Trials timeline
    timeline.push({
        timeline: [fixation, trial],
        timeline_variables: stim_list,
        randomize_order: true,
        repetitions: 1,
    })

    // Debriefing Information
    if (stimuli != stimuli_training) {
        timeline.push(create_debrief((illusion_name = illusion_name)))
    } else if ((stimuli = stimuli_training)) {
        timeline.push({
            type: jsPsychHtmlButtonResponse,
            choices: ["Continue"],
            post_trial_gap: 500,
            on_start: function () {
                ;(document.body.style.cursor = "auto"),
                    (document.querySelector(
                        "#jspsych-progressbar-container"
                    ).style.display = "inline")
            },
            stimulus: "<p><b>Great job!</b></p>",
            data: { screen: "practice_block" },
        })
    }
    return timeline
}

// Instructions for Illusion Trials
const delboeuf_instructions =
    "<p>In this part, two red circles will appear side by side on the screen.</p>" +
    "<p>Your task is to select which <b>red circle is bigger</b> in size as fast as you can, without making errors.</p>" +
    "<p>Don't get distracted by the black outlines around the red circles!</p>" +
    "<p>Press <b>the LEFT or the RIGHT arrow</b> to indicate which is the bigger <b>red circle.</b></p>" +
    "<div style='float: center'><img src='utils/stimuli_demo/Delboeuf_Demo.png' height='300'></img>" +
    "<p><img src='utils/answer/answer_leftright_keyboard.PNG' height='150'></img></p>" +
    "<p class='small'>In this example, the correct answer is the <b>LEFT arrow</b>.</p></div>" +
    "<p>Are you ready? <b>Press ENTER to start</b></p>"

const mullerlyer_instructions =
    "<p>In this part, two horizontal red lines will appear one above the other.</p>" +
    "<p>Your task is to select which <b>line is longer</b> in length as fast as you can, without making errors.</p>" +
    "<p>Don't get distracted by the surrounding black arrows at the end of the red lines!</p>" +
    "<p>Press <b>the UP or the DOWN arrow</b> to indicate where is the longer <b>red line.</b></p>" +
    "<div style='float: center'><img src='utils/stimuli_demo/MullerLyer_Demo.png' height='300'></img>" +
    "<p><img src='utils/answer/answer_updown_keyboard.PNG' height='150'></img></p>" +
    "<p class='small'>In this example, the correct answer is the <b>UP arrow</b>.</p></div>" +
    "<p>Are you ready? <b>Press ENTER to start</b></p>"

const ebbinghaus_instructions =
    "<p>In this part, two red circles will appear side by side on the screen.</p>" +
    "<p>Your task is to select which <b>red circle is bigger</b> in size as fast as you can, without making errors.</p>" +
    "<p>Don't get distracted by the surrounding black circles around the red circles!</p>" +
    "<p>Press <b>the LEFT or the RIGHT arrow</b> to indicate which is the bigger <b>red circle.</b></p>" +
    "<div style='float: center'><img src='utils/stimuli_demo/Ebbinghaus_Demo.png' height='300'></img>" +
    "<p><img src='utils/answer/answer_leftright_keyboard.PNG' height='150'></img></p>" +
    "<p class='small'>In this example, the correct answer is the <b>LEFT arrow</b>.</p></div>" +
    "<p>Are you ready? <b>Press ENTER to start</b></p>"

const ponzo_instructions =
    "<p>In this part, two horizontal red lines will appear one above the other.</p>" +
    "<p>Your task is to select which <b>line is longer</b> in length as fast as you can, without making errors.</p>" +
    "<p>Don't get distracted by the surrounding black lines!</p>" +
    "<p>Press <b>the UP or the DOWN arrow</b> to indicate which is the longer <b>red line.</b></p>" +
    "<div style='float: center'><img src='utils/stimuli_demo/Ponzo_Demo.png' height='300'></img>" +
    "<p><img src='utils/answer/answer_updown_keyboard.PNG' height='150'></img></p>" +
    "<p class='small'>In this example, the correct answer is the <b>UP arrow</b>.</p></div>" +
    "<p>Are you ready? <b>Press ENTER to start</b></p>"

const zollner_instructions =
    "<p>In this part, two horizontal red lines will appear one above the other.</p>" +
    "<p>Your task is to tell <b>the direction</b> towards which the red lines are converging, as fast as you can, and without making errors.</p>" +
    "<p>Don't get distracted by the black lines!</p>" +
    "<p>Press <b>the LEFT or the RIGHT arrow</b> to indicate the <b>direction where the red lines are pointing.</b></p>" +
    "<div style='float: center'><img src='utils/stimuli_demo/Zollner_Demo.png' height='300'></img>" +
    "<p><img src='utils/answer/answer_leftright_keyboard.PNG' height='150'></img></p>" +
    "<p class='small'>In this example, the correct answer is the <b>LEFT arrow</b>.</p></div>" +
    "<p>Are you ready? <b>Press ENTER to start</b></p>"

const contrast_instructions =
    "<p>In this part, two small grey rectangles will appear one above the other.</p>" +
    "<p>Your task is to select which rectangle is <b>lighter</b> in colour as fast as you can, without making errors.</p>" +
    "<p>Don't get distracted by the surrounding background!</p>" +
    "<p>Press <b>the UP or the DOWN arrow</b> to indicate which is the <b>lighter rectangle.</b></p>" +
    "<div style='float: center'><img src='utils/stimuli_demo/Contrast_Demo.png' height='300'></img>" +
    "<p><img src='utils/answer/answer_updown_keyboard.PNG' height='150'></img></p>" +
    "<p class='small'>In this example, the correct answer is the <b>UP arrow</b>.</p></div>" +
    "<p>Are you ready? <b>Press ENTER to start</b></p>"

const rodframe_instructions =
    "<p>In this part, one vertical red line will appear in a square.</p>" +
    "<p>Your task is to tell <b>which direction</b> the red line is leaning towards, as fast as you can, and without making errors.</p>" +
    "<p>Don't get distracted by the black square!</p>" +
    "<p>Press <b>the LEFT or the RIGHT arrow</b> to indicate the <b>direction where the red line is leaning towards.</b></p>" +
    "<div style='float: center'><img src='utils/stimuli_demo/RodFrame_Demo.png' height='300'></img>" +
    "<p><img src='utils/answer/answer_leftright_keyboard.PNG' height='150'></img></p>" +
    "<p class='small'>In this example, the correct answer is the <b>LEFT arrow</b>.</p></div>" +
    "<p>Are you ready? <b>Press ENTER to start</b></p>"

const poggendorff_instructions =
    "<p>In this part, two parallel red lines will appear, but they are partially hidden by a grey rectangle.</p>" +
    "<p>Your task is to tell if the <b>red line to the right</b> of the rectangle is above or below the line to the left. You need to answer as fast as you can, without making errors.</p>" +
    "<p>Press <b>the UP or the DOWN arrow</b> to indicate whether the <b>right red line</b> is actually <b>above or below the left red line.</b></p>" +
    "<div style='float: center'><img src='utils/stimuli_demo/Poggendorff_Demo.png' height='300'></img>" +
    "<p><img src='utils/answer/answer_updown_keyboard.PNG' height='150'></img></p>" +
    "<p class='small'>In this example, the correct answer is the <b>UP arrow</b>.</p></div>" +
    "<p>Are you ready? <b>Press ENTER to start</b></p>"

const white_instructions =
    "<p>In this part, two vertical grey rectangles will appear side by side.</p>" +
    "<p>Your task is to tell <b>which rectangle is of a lighter color</b>, as fast as you can, and without making errors.</p>" +
    "<p>Don't get distracted by the background color!</p>" +
    "<p>Press <b>the LEFT or the RIGHT arrow</b> to indicate which <b>side has the lighter grey rectangle.</b></p>" +
    "<div style='float: center'><img src='utils/stimuli_demo/White_Demo.png' height='300'></img>" +
    "<p><img src='utils/answer/answer_leftright_keyboard.PNG' height='150'></img></p>" +
    "<p class='small'>In this example, the correct answer is the <b>LEFT arrow</b>.</p></div>" +
    "<p>Are you ready? <b>Press ENTER to start</b></p>"

const verticalhorizontal_instructions =
    "<p>In this part, two red lines will appear side by side.</p>" +
    "<p>Your task is to tell <b>which line is longer</b> in length as fast as you can, and without making errors.</p>" +
    "<p>Don't get distracted by the orientation of the lines!</p>" +
    "<p>Press <b>the LEFT or the RIGHT arrow</b> to indicate which <b>line is the longer one.</b></p>" +
    "<div style='float: center'><img src='utils/stimuli_demo/VerticalHorizontal_Demo.png' height='300'></img>" +
    "<p><img src='utils/answer/answer_leftright_keyboard.PNG' height='150'></img></p>" +
    "<p class='small'>In this example, the correct answer is the <b>LEFT arrow</b>.</p></div>" +
    "<p>Are you ready? <b>Press ENTER to start</b></p>"



/* Psychometric scales---------------------------------------------------------------------*/

// Mini IPIP scale
var IPIP = [
    "Am the life of the party",
    "Sympathize with others' feelings",
    "Get chores done right away",
    "Have frequent mood swings",
    "Have a vivid imagination",
    "Do not talk a lot",
    "Am not interested in other people's problems",
    "Have difficulty understanding abstract ideas",
    "Like order",
    "Make a mess of things",
    "Deserve more things in life",
    "Do not have a good imagination",
    "Feel other's emotions",
    "Am relaxed most of the time",
    "Get upset easily",
    "Seldom feel blue",
    "would like to be seen driving around in a very expensive car",
    "Keep in the background",
    "Am not really interested in others",
    "Am not interested in abstract ideas",
    "Often forget to put things back in their proper place",
    "Talk to a lot of different people at parties",
    "Would get a lot of pleasure from owning expensive luxury goods"
]

var IPIP_dim = [
    "Ext_1", "Agr_2", "Con_3", "Neu_4", "Open_5",
    "HH_6_R", "Ext_7_R", "Agr_8_R", "Open_9_R", "Con_10",
    "Con_11_R", "HH_12_R", "Open_13_R", "Agr_14", "Neu_15_R",
    "Neu_16", "Neu_17_R", "HH_18_R", "Ext_19_R", "Agr_20_R",
    "Open_21_R", "Con_22_R", "Ext_23", "HH_24_R"
]

var PID = [
    "People would describe me as reckless",
    "I feel like I act totally on impulse",
    "Even though I know better, I can't stop making rash decisions",
    "I often feel like nothing I do really matters",
    "Others see me as irresponsible",
    "I'm not good at planning ahead",
    "My thoughts often don't make sense to others",
    "I worry about almost everything",
    "I get emotional easily, often for very little reason",
    "I fear being alone in life more than anything else",
    "I get stuck on one way of doing things,even when it's clear it won't work",
    "I have seen things that weren't really there",
    "I steer clear of romantic relationships",
    "I'm not interested in making friends",
    "I get irritated easily by all sorts of things",
    "I don't like to get too close to people",
    "It's no big deal if I hurt other people's feelings",
    "I rarely get enthusiastic about anything",
    "I crave attention",
    "I often have to deal with people who are less important than me",
    "I often have thoughts that make sense to me but that other people say are strange",
    "I use people to get what I want",
    "I often 'zone out' and then suddenly come to and realize that a lot of time has passed",
    "Things around me often feel unreal, or more real than usual",
    "It is easy for me to take advantage of others"
]

var PID_dim =[
    "Dis_1", "Dis_2", "Dis_3", "Det_4", "Dis_5",
    "Dis_6", "Psych_7", "NA_8", "NA_9", "NA_10",
    "NA_11", "Psych_12", "Det_13", "Det_14", "NA_15",
    "Det_16", "Ant_17", "Det_18", "Ant_19", "Ant_20",
    "Psych_21", "Ant_22", "Psych_23", "Psych_24", "Ant_25"
]
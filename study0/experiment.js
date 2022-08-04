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
        var score_to_display = 100 - (ies/50)
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
            Math.round(results.score) +
            "</p>"
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
    // trial_duration: 0, // (for testing)
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
        "<p><b>BREAK</b></p>" +
        "<p>You have reached the middle of the game.</p>" +
        "<p>In the second part, you will see all the illusions once again. <b>Try to beat your previous score!</b></p>" +
        "<p>We know it's long and challenging, so take a moment to rest. When you are ready, press the button below.</p>",
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
                // show_screen.display_score +
                // "<hr>" +
                // // For debugging purposes, show the raw data.
                // show_screen.display_accuracy +
                // "<hr>" +
                // show_screen.display_rt +
                // "<hr>" +
                // //
                // show_screen.display_comparison +
                "<p>Great job!</p>" +
                "<p>Can you do better in the next block?</p>"
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
function make_trial(instructions, illusion_name, type) {
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
    timeline.push(create_debrief((illusion_name = illusion_name)))
    return timeline
}

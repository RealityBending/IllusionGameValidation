/* ----------------- Internal Functions ----------------- */
function get_results(illusion_mean, illusion_sd, illusion_type) {
    if (typeof illusion_type != "undefined") {
        var trials = jsPsych.data
            .get()
            .filter({ screen: "Trial", block: illusion_type }) // results by block
    } else {
        var trials = jsPsych.data.get().filter({ screen: "Trial" }) // overall results
    }
    var correct_trials = trials.filter({ correct: true })
    var proportion_correct = correct_trials.count() / trials.count()
    var rt_mean = trials.select("rt").mean()
    if (correct_trials.count() > 0) {
        var rt_mean_correct = correct_trials.select("rt").mean()
        var ies = rt_mean_correct / proportion_correct // compute inverse efficiency score
        var score_to_display = 5000 - ies
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
    // trial_duration: 0, (for testing)
    trial_duration: function () {
        return randomInteger(250, 750) // Function from RealityBending/JSmisc
    },
    /* trial_duration: function(){
                return jsPsych.randomization.sampleWithoutReplacement([250, 500, 750, 1000], 1)[0];
                }, */
    save_trial_parameters: {
        trial_duration: true,
    },
    data: { screen: "fixation" },
}



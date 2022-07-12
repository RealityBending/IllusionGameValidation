# Preprocessing Function
preprocess_IllusionGame <- function(file) {

  json <- jsonlite::fromJSON(file)

  # Info
  info <- json[json$screen == "participant_info" & !is.na(json$screen), ]

  # Trials
  trials <- json[!is.na(json$block)]


  data <- data.frame(Participant = trials$participant_id,
                     Date = info$date,
                     Time = info$time,
                     Duration = json[json$screen == "final_results" & !is.na(json$screen), "time_elapsed"] / 1000 / 60,
                     Screen_Resolution = paste0(trials$screen_width, "x", trials$screen_height),
                     Screen_Refresh = trials$vsync_rate,
                     Browser = trials$browser,
                     Browser_Version = trials$browser_version,
                     Device = ifelse(trials$mobile == TRUE, "Mobile", "Desktop"),
                     Device_OS = trials$os,
                     Illusion_Type = trials$type,
                     Trial = trials$trial_number,
                     Block = trials$block_number,
                     Illusion_Strength = trials$illusion_strength,
                     Illusion_Difference = trials$illusion_difference,
                     Answer = unlist(trials$response),
                     Correct = as.integer(as.logical(trials$correct)),
                     RT = trials$rt)

  data$Illusion_Type <- ifelse(data$Illusion_Type == "MullerLyer", "Müller-Lyer", data$Illusion_Type)

  # data$Stimulus <- trials$stimulus |>
  #                   stringr::str_remove(pattern="stimuli/") |>
  #                   stringr::str_remove(pattern=".png")

  data
}


# Run ---------------------------------------------------------------------
files <- list.files(path="data/", pattern = "\\.json$", full.names = TRUE)

# Loop over each file and compute function
df <- data.frame()
for(file in files) df <- rbind(df, preprocess_IllusionGame(file))

# Clean dataframe
df





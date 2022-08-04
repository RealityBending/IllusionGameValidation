# Preprocess for Study 0
preprocess <- function(file){

  data <- jsonlite::fromJSON(file, flatten=TRUE)

  if (!"final_results" %in% data$screen) {
    print(paste0("Warning: Incomplete data for ", file))
    return(data.frame())
  }

  data <- data[!is.na(data$screen), ]
  trials <- data[data$screen == 'Trial', ]

  df <- data.frame(
    Participant = trials$participant_id,
    Duration = as.numeric(data[data$screen == "final_results", "time_elapsed"]) / 1000 / 60,
    Illusion_Type = trials$type,
    Block_Order = as.numeric(trials$block_number),
    Trial = as.numeric(trials$trial_number),
    Stimulus = gsub(".png", "", gsub("stimuli/", "", trials$stimulus)),
    Illusion_Strength = as.numeric(trials$illusion_strength),
    Illusion_Side = as.factor(sign(as.numeric(trials$illusion_difference))),
    Illusion_Difference = abs(as.numeric(trials$illusion_difference)),
    Answer = trials$response,
    Error = as.integer(!as.logical(trials$correct)),
    ISI = as.numeric(data[data$screen == "fixation" & !is.na(data$screen), "trial_duration"]),
    RT = as.numeric(trials$rt)
  )

  # Format names
  df$Illusion_Type <- ifelse(df$Illusion_Type == "MullerLyer", "Müller-Lyer", df$Illusion_Type)
  df$Illusion_Type <- ifelse(df$Illusion_Type == "Zollner", "Zöllner", df$Illusion_Type)
  df$Illusion_Type <- ifelse(df$Illusion_Type == "RodFrame", "Rod-Frame", df$Illusion_Type)
  df$Illusion_Type <- ifelse(df$Illusion_Type == "VerticalHorizontal", "Vertical-Horizontal", df$Illusion_Type)

  df
}

# Run ---------------------------------------------------------------------
participants <- list.files("data/")


df <- data.frame()
for (ppt in participants) {
  df <- rbind(df, preprocess(file = paste0("data/", ppt)))
}
df$Illusion_Side <- as.factor(df$Illusion_Side)

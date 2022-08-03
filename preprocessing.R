# Preprocessing Function
preprocess_raw <- function(file) {
  data <- read.csv(file)

  if (!"final_results" %in% data$screen) {
    print(paste0("Warning: Incomplete data for ", file))
    return(data.frame())
  }

  # Demographics
  dem <- data[data$screen == "demographics" & !is.na(data$screen), "response"]

  # Info
  info <- data[data$screen == "browser_info" & !is.na(data$screen), ]


  trials <- data[data$screen == "Trial", ]
  df <- data.frame(
    Participant = trials$participant_id,
    Age = as.numeric(jsonlite::fromJSON(dem[1])$age),
    Sex = jsonlite::fromJSON(dem[2])$sex,
    Education = jsonlite::fromJSON(dem[2])$education,
    Nationality = tools::toTitleCase(jsonlite::fromJSON(dem[1])$nationality),
    Ethnicity = tools::toTitleCase(jsonlite::fromJSON(dem[1])$ethnicity),
    Date = ifelse(is.null(info$date), NA, info$date),
    Time = ifelse(is.null(info$time), NA, info$time),
    Duration = as.numeric(data[data$screen == "final_results", "time_elapsed"]) / 1000 / 60,
    Break_Duration = as.numeric(data[data$screen == "break" & !is.na(data$screen), "rt"]) / 1000 / 60,
    Screen_Resolution = paste0(trials$screen_width, "x", trials$screen_height),
    Screen_Size = (as.numeric(trials$screen_width) / 1000) * (as.numeric(trials$screen_height) / 1000),
    Screen_Refresh = trials$vsync_rate,
    Browser = trials$browser,
    Browser_Version = trials$browser_version,
    Device = ifelse(trials$mobile == TRUE, "Mobile", "Desktop"),
    Device_OS = trials$os,
    Illusion_Type = trials$type,
    Block = ifelse(trials$block_number > 10, 2, 1),
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

  # Correct duration
  df$Duration <- df$Duration - df$Break_Duration

  # Format names
  df$Illusion_Type <- ifelse(df$Illusion_Type == "MullerLyer", "Müller-Lyer", df$Illusion_Type)
  df$Illusion_Type <- ifelse(df$Illusion_Type == "Zollner", "Zöllner", df$Illusion_Type)
  df$Illusion_Type <- ifelse(df$Illusion_Type == "RodFrame", "Rod-Frame", df$Illusion_Type)
  df$Illusion_Type <- ifelse(df$Illusion_Type == "VerticalHorizontal", "Vertical-Horizontal", df$Illusion_Type)

  # Format education
  df$Education <- gsub("University (", "", df$Education, fixed = TRUE)
  df$Education <- gsub(")", "", df$Education, fixed = TRUE)
  df$Education <- tools::toTitleCase(df$Education)

  # Standardize demographics
  # unique(df$Ethnicity)
  df$Ethnicity <- ifelse(df$Ethnicity %in% c("Hispanic", "Hisapanic"), "Latino", df$Ethnicity)
  df$Ethnicity <- ifelse(df$Ethnicity %in% c("Mixed/Latino", "Mexicano"), "Latino", df$Ethnicity)
  df$Ethnicity <- ifelse(df$Ethnicity %in% c("Latin"), "Latino", df$Ethnicity)
  df$Ethnicity <- ifelse(df$Ethnicity %in% c("White Middle European (Slavic)", "Greek"), "Caucasian", df$Ethnicity)
  df$Ethnicity <- ifelse(df$Ethnicity %in% c("White - Caucasian", " Caucasian"), "Caucasian", df$Ethnicity)
  df$Ethnicity <- ifelse(df$Ethnicity %in% c("White", "Caucasian "), "Caucasian", df$Ethnicity)
  df$Ethnicity <- ifelse(df$Ethnicity %in% c("Black"), "African", df$Ethnicity)
  df$Ethnicity <- ifelse(df$Ethnicity %in% c("5c73e5d89b46930001ee7edc"), NA, df$Ethnicity)

  # unique(df$Nationality)
  df$Nationality <- ifelse(df$Nationality %in% c("Israe;"), "Israel", df$Nationality)

  df
}



# Run ---------------------------------------------------------------------


# This is a local folder containing raw data from unzipped pavlovia
# It has been added to .gitignore to NOT be published on github
# (it contains the subject ID of the participants)
participants <- list.files("study1/rawdata/")


df <- data.frame()
for (ppt in participants) {
  df <- rbind(df, preprocess_raw(file = paste0("study1/rawdata/", ppt)))
}

# Study 1
df$Study <- 1
df$Pyllusion <- "1.1"
df[df$Illusion_Type == "Delboeuf", "Illusion_Difference"] <- sqrt(df[df$Illusion_Type == "Delboeuf", "Illusion_Difference"])
df[df$Illusion_Type == "Ebbinghaus", "Illusion_Difference"] <- sqrt(df[df$Illusion_Type == "Ebbinghaus", "Illusion_Difference"])
df[df$Illusion_Type == "Rod-Frame", "Illusion_Strength"] <- -1 * (df[df$Illusion_Type == "Rod-Frame", "Illusion_Strength"])
df[df$Illusion_Type == "Zöllner", "Illusion_Strength"] <- -1 * round(df[df$Illusion_Type == "Zöllner", "Illusion_Strength"], 1)






# Transformation
df$Illusion_Difference_log <- log(1 + df$Illusion_Difference)
df$Illusion_Strength_log <- sign(df$Illusion_Strength) * log(1 + abs(df$Illusion_Strength))

# Save anonmized data
write.csv(df, "data/study1.csv", row.names = FALSE)

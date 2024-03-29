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

  # Filter out practice trials
  if ("practice_debrief" %in% data$screen) {
    data <- data[which(data$screen == "practice_debrief"):nrow(data), ]
  }


  # Trial data
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
    Break_Duration = as.numeric(data[data$screen %in% c("break", "break2") & !is.na(data$screen), "rt"]) / 1000 / 60,
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
    # Illusion_Effect = ifelse(sign(as.numeric(trials$illusion_strength)) == -1, "Congruent", ifelse(sign(as.numeric(trials$illusion_strength)) == 0, "Null", "Incongruent")),
    Illusion_Effect = ifelse(sign(as.numeric(trials$illusion_strength)) == -1, "Congruent", "Incongruent"),
    Illusion_Side = as.factor(sign(as.numeric(trials$illusion_difference))),
    Illusion_Difference = abs(as.numeric(trials$illusion_difference)),
    Answer = trials$response,
    Error = as.integer(!as.logical(trials$correct)),
    ISI = as.numeric(data[data$screen == "fixation" & !is.na(data$screen), "trial_duration"]),
    RT = as.numeric(trials$rt)
  )


  if("IPIP6" %in% data$screen) {
    # IPIP6
    ipip6 <- as.data.frame(jsonlite::fromJSON(data[data$screen == "IPIP6", "response"]))
    ipip6[grepl("_R", names(ipip6))] <- 100 - ipip6[grepl("_R", names(ipip6))]
    df$IPIP6_Extraversion <- rowMeans(ipip6[grepl("Extraversion", names(ipip6))])
    df$IPIP6_Conscientiousness <- rowMeans(ipip6[grepl("Conscientiousness", names(ipip6))])
    df$IPIP6_Neuroticism <- rowMeans(ipip6[grepl("Neuroticism", names(ipip6))])
    df$IPIP6_Openness <- rowMeans(ipip6[grepl("Openness", names(ipip6))])
    df$IPIP6_HonestyHumility <- rowMeans(ipip6[grepl("HonestyHumility", names(ipip6))])
    df$IPIP6_Agreeableness <- rowMeans(ipip6[grepl("Agreeableness", names(ipip6))])
    df$IPIP6_SD <- mean(c(sd(ipip6[grepl("Extraversion", names(ipip6))]),
                          sd(ipip6[grepl("Conscientiousness", names(ipip6))]),
                          sd(ipip6[grepl("Neuroticism", names(ipip6))]),
                          sd(ipip6[grepl("Openness", names(ipip6))]),
                          sd(ipip6[grepl("HonestyHumility", names(ipip6))]),
                          sd(ipip6[grepl("Agreeableness", names(ipip6))])))

    # PID5
    pid5 <- as.data.frame(jsonlite::fromJSON(data[data$screen == "PID6", "response"]))
    df$PID5_Disinhibition <- rowMeans(pid5[grepl("Disinhibition", names(pid5))])
    df$PID5_Detachment <- rowMeans(pid5[grepl("Detachment", names(pid5))])
    df$PID5_NegativeAffect <- rowMeans(pid5[grepl("NegativeAffect", names(pid5))])
    df$PID5_Antagonism <- rowMeans(pid5[grepl("Antagonism", names(pid5))])
    df$PID5_Psychoticism <- rowMeans(pid5[grepl("Psychoticism", names(pid5))])
    df$PID5_SD <- mean(c(sd(pid5[grepl("Disinhibition", names(pid5))]),
                         sd(pid5[grepl("Detachment", names(pid5))]),
                         sd(pid5[grepl("NegativeAffect", names(pid5))]),
                         sd(pid5[grepl("Antagonism", names(pid5))]),
                         sd(pid5[grepl("Psychoticism", names(pid5))])))
  } else {
    df$IPIP6_Extraversion <- df$IPIP6_Conscientiousness <- df$IPIP6_Neuroticism <- df$IPIP6_Openness <- df$IPIP6_HonestyHumility <- df$IPIP6_Agreeableness <- df$IPIP6_SD <- NA
    df$PID5_Disinhibition <- df$PID5_Detachment <- df$PID5_NegativeAffect <- df$PID5_Antagonism <- df$PID5_Psychoticism <- df$PID5_SD <- NA
  }


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
  df$Ethnicity <- ifelse(df$Ethnicity %in% c("Hispanic/Latino ", "Latin American "), "Latino", df$Ethnicity)
  df$Ethnicity <- ifelse(df$Ethnicity %in% c("Latin", "Latina", "HISPANIC", "Mexican"), "Latino", df$Ethnicity)
  df$Ethnicity <- ifelse(df$Ethnicity %in% c("Latino American", "Latino/Hispanic", "Latinx"), "Latino", df$Ethnicity)
  df$Ethnicity <- ifelse(df$Ethnicity %in% c("White Middle European (Slavic)", "Greek"), "Caucasian", df$Ethnicity)
  df$Ethnicity <- ifelse(df$Ethnicity %in% c("White - Caucasian", " Caucasian"), "Caucasian", df$Ethnicity)
  df$Ethnicity <- ifelse(df$Ethnicity %in% c("White", "Caucasian ", "German", "English"), "Caucasian", df$Ethnicity)
  df$Ethnicity <- ifelse(df$Ethnicity %in% c("European/White", "WHITE", "White Ethnic", "American"), "Caucasian", df$Ethnicity)
  df$Ethnicity <- ifelse(df$Ethnicity %in% c("White/Caucasian", "British", "White/European"), "Caucasian", df$Ethnicity)
  df$Ethnicity <- ifelse(df$Ethnicity %in% c("Polish", "White British", "European", "Biały Europejski", "Slavic"), "Caucasian", df$Ethnicity)
  df$Ethnicity <- ifelse(df$Ethnicity %in% c("White Caucasian", "Eastern Eurpean"), "Caucasian", df$Ethnicity)
  df$Ethnicity <- ifelse(df$Ethnicity %in% c("Black", "Black African ", "African American"), "African", df$Ethnicity)
  df$Ethnicity <- ifelse(df$Ethnicity %in% c("BLACK", "Black African", "Black "), "African", df$Ethnicity)
  df$Ethnicity <- ifelse(df$Ethnicity %in% c("Cambodian", "Chinese"), "Asian", df$Ethnicity)
  df$Ethnicity <- ifelse(df$Ethnicity %in% c("Mixed (White Hispanic)", "Mixed Race", "HALF BLOOD"), "Mixed", df$Ethnicity)
  df$Ethnicity <- ifelse(df$Ethnicity %in% c("Indian", "Pakistani"), "South Asian", df$Ethnicity)
  df$Ethnicity <- ifelse(df$Ethnicity %in% c("Indian", "Pakistani"), "South Asian", df$Ethnicity)
  df$Ethnicity <- ifelse(df$Ethnicity %in% c("5c73e5d89b46930001ee7edc"), NA, df$Ethnicity)
  df$Ethnicity <- ifelse(df$Ethnicity %in% c("Arabic", "South Asian", "Mixed", "Asian"), "Other", df$Ethnicity)


  # unique(df$Nationality)
  df$Nationality <- ifelse(df$Nationality %in% c("Israe;"), "Israel", df$Nationality)
  df$Nationality <- ifelse(df$Nationality %in% c("BRAZIL"), "Brazil", df$Nationality)
  df$Nationality <- ifelse(df$Nationality %in% c("MEXICO", "México", "Mexcio", " Mexico", "México "), "Mexico", df$Nationality)
  df$Nationality <- ifelse(df$Nationality %in% c("ZIMBABWE"), "Zimbabwe", df$Nationality)
  df$Nationality <- ifelse(df$Nationality %in% c("United Kingdom", "Northern Ireland", "Scotland", "England", "Wales"), "UK", df$Nationality)
  df$Nationality <- ifelse(df$Nationality %in% c("Ukraina"), "Ukraine", df$Nationality)
  df$Nationality <- ifelse(df$Nationality %in% c("United States", "United States of America", "United States "), "USA", df$Nationality)
  df$Nationality <- ifelse(df$Nationality %in% c("Czechia"), "Czech Republic", df$Nationality)
  df$Nationality <- ifelse(df$Nationality %in% c("Poland ", "Polska"), "Poland", df$Nationality)
  df$Nationality <- ifelse(df$Nationality %in% c("South African"), "South Africa", df$Nationality)

  # larger groupings
  # df$NationalityGroup <- ifelse(df$Nationality %in% c("Wales", "Germany", "Greece", "Portugal", "UK", "Scotland", "England", "Ireland", "Spain", "Austria", "Spain", "Switzerland", "Italy", "USA", "New Zealand", "Canada", "Finland", "Australia"), "Western", df$Nationality)
  # df$NationalityGroup <- ifelse(df$NationalityGroup %in% c("Poland", "Hungary", "Estonia", "Ukraine", "Czech Republic"), "Eastern", df$NationalityGroup)
  # df$NationalityGroup <- ifelse(df$NationalityGroup %in% c("Mexico", "México ", "Chile", "Brazil"), "South American", df$NationalityGroup)
  # df$NationalityGroup <- ifelse(df$NationalityGroup %in% c("Nigeria", "Zimbabwe", "Algeria"), "African", df$NationalityGroup)
  # df$NationalityGroup <- ifelse(df$NationalityGroup %in% c("South Africa"), "South African", df$NationalityGroup)
  # df$NationalityGroup <- ifelse(df$NationalityGroup %in% c("Turkey"), "Other", df$NationalityGroup)

  df
}





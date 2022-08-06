# Preprocessing Function
preprocess_raw <- function(file) {
  
  library(tidyverse)
  
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
    Break_Duration1 = as.numeric(data[data$screen == "break1" & !is.na(data$screen), "rt"]) / 1000 / 60,
    Break_Duration2 = as.numeric(data[data$screen == "break2" & !is.na(data$screen), "rt"]) / 1000 / 60,
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
  df$Duration <- df$Duration - df$Break_Duration1 - df$Break_Duration2
  
  # Manual fixes
  df[df$Participant == "5d3c6e745602310001bca8aa_6bdtb", "Sex"] <- "Female"
  
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
  df$Ethnicity <- ifelse(df$Ethnicity %in% c("White", "Caucasian ", "German"), "Caucasian", df$Ethnicity)
  df$Ethnicity <- ifelse(df$Ethnicity %in% c("Black"), "African", df$Ethnicity)
  df$Ethnicity <- ifelse(df$Ethnicity %in% c("5c73e5d89b46930001ee7edc"), NA, df$Ethnicity)
  
  
  # unique(df$Nationality)
  df$Nationality <- ifelse(df$Nationality %in% c("Israe;"), "Israel", df$Nationality)
  
  # Insert Personality Scale Scores 
  # Internal Utility function to extract responses from json nested columns in csv file 
  extract_response <- function (scale){
    response <- data  |>
      dplyr::filter(screen==scale, !is.na(response), response!='null') |>
      select(response) |>
      separate_rows(response, sep=',') |>
      separate(response, into = c('question', 'answer'), sep=':') |>
      select(question, answer)|>
      as.data.frame() |>
      mutate(across(everything(),~ gsub("[[:punct:]]", "", .))) |>
      na.omit()
    
    # Convert scores to numeric
    response$answer <- as.numeric(as.character(response$answer))
    
    response
  }
  
  ipip <- extract_response('IPIP6')
  pid <- extract_response('PID6')
  
  # Fix for participants with missing HH_6_R in IPIP
  out <- c('5eb3a734d249ac18a413063a',
           '60f5fa488f7b1381d175ecb5',
           '5bdbfff9ee652a0001efca64',
           '615336dc62c0a2ff064e8ebe',
           '5b232f6838fc0c000131438c',
           '611d69ffd22b95ca500604b2',
           '60feabd18109e08e594540f8',
           '6165e0b51a883e9db8cc7146',
           '62d6d791bb6448ae52929ebd',
           '61645edbf8a9840feeb735b6',
           '5cdc88cc50f50f001a783112',
           '60c21f5f1389f65d2d88a3bf',
           '60560efe16c645d2a9bd0daa',
           '5f6b027e6eae971e2fa13594',
           '61034f24da19cc56177b8b59',
           '5d6e3252dfe6d10001dbe508',
           '5c43cd414fe4f800016e4983',
           '610a9a0723dac03a63f15035',
           '60ec51c51a3158a50ded8a3e',
           '5f9aba6600cdf11f1c9b915c',
           '610cda1332fb63830158c55d',
           '6106ac34408681f3b0d07396',
           '5f439ac86b921f5fac4f55ad',
           '62da72f3fb2ff174670bc85f',
           '5c437f6a4fe4f800016e3d52',
           '60087e9189ddb34b79b08be5',
           '5f97e6601f6d0e016087fc91',
           '60d60bb9ced0566454d42750',
           '61264d8a5de54eb1e42ed381',
           '615d7acbb9a02581184e33af',
           '613d8489ab93bd9635c12051',
           '5e6e14f53c76d23b934a67f3',
           '5c1bb460a05a64000125c522',
           '611fb1635c5f446a6bb2848d',
           '5ed7a7a467a98224295459ff')
  
  fixed_question <- c("Extraversion_1",
                      "Agreeableness_2",
                      "Conscientiousness_3",
                      "Neuroticism_4",
                      "Openness_5",
                      "Extraversion_7_R",
                      "Agreeableness_8_R",
                      "Openness_9_R",
                      "Conscientiousness_10",
                      "Conscientiousness_11_R",
                      "HonestyHumility_12_R",
                      "Openness_13_R",
                      "Agreeableness_14",
                      "Neuroticism_15_R",
                      "Neuroticism_16",
                      "Neuroticism_17_R",
                      "HonestyHumility_18_R",
                      "Extraversion_19_R",
                      "Agreeableness_20_R",
                      "Openness_21_R",
                      "Conscientiousness_22_R",
                      "Extraversion_23",
                      "HonestyHumility_24_R")
  
  
  if (strsplit(data$participant_id[1], "[_]")[[1]][1] %in% out){
    ipip$question <- fixed_question
    
    # Reverse Code items in IPIP 
    reverse_items <- ipip[endsWith(ipip$question, "R"), ]
    reverse_items$answer <- 100 - reverse_items$answer
    ipip$answer[match(reverse_items$question, ipip$question)] <- reverse_items$answer
    
    # Compute IPIP scores based on dimension
    ipip_scores <- ipip |> 
      mutate(ipip_dim = str_extract(question, "[[:alnum:]]+")) |>
      group_by(ipip_dim) |> 
      select(-question) 
    
    ipip_ave <- ipip_scores |>
      summarize_at(vars(answer), list(Average=mean)) |>
      as.data.frame()|>
      pivot_wider(names_from='ipip_dim', values_from = Average) |>
      as.data.frame()
    
  }else{
    ipip$question <- ipip$question
    # Reverse Code items in IPIP 
    reverse_items <- ipip[endsWith(ipip$question, "R"), ]
    reverse_items$answer <- 100 - reverse_items$answer
    ipip$answer[match(reverse_items$question, ipip$question)] <- reverse_items$answer
    
    # Compute IPIP scores based on dimension
    ipip_scores <- ipip |> 
      mutate(ipip_dim = str_extract(question, "[[:alpha:]]+(?=\\d)")) |>
      group_by(ipip_dim) |> 
      select(-question) 
    
    ipip_ave <- ipip_scores |>
      summarize_at(vars(answer), list(Average=mean)) |>
      as.data.frame()|>
      pivot_wider(names_from='ipip_dim', values_from = Average) |>
      as.data.frame()
  }
  
  #Compute PID scores based on dimension
  pid_scores <- pid |> 
    mutate(pid_dim = str_extract(question, "[[:alpha:]]+(?=\\d)")) |>
    group_by(pid_dim) |> 
    select(-question) 
  
  pid_ave <- pid_scores |>
    summarize_at(vars(answer), list(Average=mean)) |>
    as.data.frame()|>
    pivot_wider(names_from='pid_dim', values_from = Average) |>
    as.data.frame()
  
  # Merge personality scale scores with df
  df <- merge(df, ipip_ave)
  df<- merge(df, pid_ave)
  
  df
}

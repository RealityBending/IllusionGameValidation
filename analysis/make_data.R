library(rjson)


data_path <- "../data/"
data <- data.frame()  # Initialize empty dataframe


# Define Preprocessing functions ------------------------------------------

clean_object <- function(screen) {
  screen[names(screen)[sapply(screen, is.null)]] <- NA
  screen
}

preprocess_fullscreen <- function(df){
  if(df$trial_type == "fullscreen"){
    df$trial_type <- "Yes"
  } else {
    df$trial_type <- "No"
  }
  out <- as.data.frame(as.factor(df$trial_type))
  colnames(out) <- c("Fullscreen")
  out
}

preprocess_session_info <- function(df) {
  names(df) <- tools::toTitleCase(names(df))
  df$Duration_Consent <- df$Rt
  df[c("Button_pressed", "Stimulus", "Screen" ,"Rt", "Internal_node_id", "Time_elapsed", "Trial_index", "Trial_type", "Response")] <- NULL
  names(df)[names(df) == "Participant_id"] <- "Participant_ID"
  df
}

preprocess_participant_info_general <- function(df) {
  out <- as.data.frame(df$response[1])
  out <- cbind(out, as.data.frame(df$response[2]))
  out$Duration_InfoGeneral <- df$rt
  out
}

preprocess_participant_info_repetition <- function(df) {
  if(df$response$Q0 == "No, what do I need to do?"){
    df$response$Q0 <- "No"
  } else {
    df$response$Q0 <- "Yes"
  }
  out <- as.data.frame(as.factor(df$response$Q0))
  colnames(out) <- c("PlayedBefore")
  out$Duration_InfoSession <- df$rt
  out
}

preprocess_trial <- function(df) {
  df <- df[!stringr::str_detect(names(df), pattern="click_")]  # remove click_x and click_y
  names(df) <- tools::toTitleCase(names(df))
  df[c("Screen" ,"Internal_node_id", "Time_elapsed", "Trial_type")] <- NULL
  names(df)[names(df) == "Rt"] <- "RT"
  df
}

preprocess_results <- function(df, per_block = TRUE) {
  scores_cols <- c("accuracy", "rt_mean", "rt_mean_correct", "inverse_efficiency_score")
  if(per_block) {
    df <- df[c(scores_cols, "block")] # keep only these values
    names(df)[names(df) == "block"] <- "Block"
  } else {
    df <- df[scores_cols]
  }
  names(df)[names(df) == "inverse_efficiency_score"] <- "IES" # shorten names
  names(df)[names(df) == "rt_mean"] <- "RT_Mean"
  names(df)[names(df) == "rt_mean_correct"] <- "RT_Mean_Corr"
  names(df)[names(df) == "accuracy"] <- "Accuracy"
  
  df <- as.data.frame(df)
  if(!per_block) {
    colnames(df) <- paste0('Grand_', colnames(df))
    df
  } else {
    colnames(df)[colnames(df) != "Block"] <- paste0('Block_', colnames(df[ ,!(colnames(df) %in% "Block")]))
    df
  }
}

preprocess_question <- function(df, index = NULL, label = NULL){
  if(is.null(label)) {
    label <- gsub("<.*?>", "", df$stimulus)
  }
  if(is.null(index)) {
    index <- paste0("Q", df$trial_index)
  }
  out <- data.frame(Temp = NA)
  out[paste0(index, "_Label")] <- label
  out[paste0(index, "_Score")] <- df$response
  out[paste0(index, "_RT")] <- df$rt
  out$Temp <- NULL
  out
}

preprocess_interactions <- function(x){
  df <- data.frame()
  for(event in x){
    df <- rbind(df, as.data.frame(event))
  }
  names(df) <- tools::toTitleCase(names(df))
  names(df)[names(df) == "Trial"] <- "Trial_index"
  df
}


# Run the preprocessing ---------------------------------------------------

# Loop through all the files
# for(file in list.files(data_path)) {
for(file in list.files(data_path)) {
  # 5th data file marks start of new exp template

  # Read JSON
  rawdata <- rjson::fromJSON(file=paste0(data_path, file))

  # Find interactions (not sure hat to do with them for now)
  # for(screen in rawdata){
  #   if(!is.null(screen$screen) && screen$screen == "question_difficulty") {
  #     interactions <- preprocess_interactions(rjson::fromJSON(screen$interactions))
  #   }
  # }

  trials <- data.frame()
  block_results <- data.frame()
  info <- data.frame(Temp = 1)

  # Loop through all the "screens" (each screen is recorded as a separate list)
  for(screen in rawdata){
    
    screen <- clean_object(screen)

    if(screen$trial_index == 0) {
      info <- cbind(info, preprocess_fullscreen(screen))
    }
    if(!is.null(screen$screen) && screen$screen == "session_info") {
      info <- cbind(info, preprocess_session_info(as.data.frame(screen)))
    }
    if(!is.null(screen$screen) && screen$screen == "participant_info_general") {
      info <- cbind(info, preprocess_participant_info_general(screen))
    }
    if(!is.null(screen$screen) && screen$screen == "participant_info_repetition") {
      info <- cbind(info, preprocess_participant_info_repetition(screen))
    }
    if(!is.null(screen$screen) && screen$screen == "test") {
      trials <- rbind(trials, preprocess_trial(as.data.frame(screen)))
    }
    
    if(!is.null(screen$screen) && screen$screen == "final_results") {
      info <- cbind(info, preprocess_results(screen, per_block=FALSE))
    }
    if(!is.null(screen$screen) && screen$screen == "block_results") {
      block_results <- rbind(block_results, preprocess_results(screen, per_block=TRUE))
    }

    # if(!is.null(screen$screen) && screen$screen == "question_difficulty") {
    #   screen$interactions <- NULL
    #   info <- cbind(info, preprocess_question(as.data.frame(screen), index="Q_Difficulty"))
    # }
  }
  
  info$Temp <- NULL
  trials <- dplyr::left_join(trials, block_results)
  data <- rbind(data, cbind(trials, info))
  
  }

# Rearrange and tidy columns
data$Illusion_Strength <- sapply(strsplit(data$Stimulus, "_"), function(x) x[2])
data$Illusion_Strength  <- as.numeric(str_remove(data$Illusion_Strength , paste(remove, collapse = "|")))

data$Illusion_Difference <- sapply(strsplit(data$Stimulus, "_"), function(x) x[3])
data$Illusion_Difference <-  str_remove(data$Illusion_Difference, paste(remove, collapse = "|"))
data$Illusion_Difference <- as.numeric(tools::file_path_sans_ext(data$Illusion_Difference))

data <- data %>% 
  select(Participant_ID, Age, Initials, PlayedBefore, Stimulus, Illusion_Strength, Illusion_Difference, everything())


write.csv(data, "data.csv", row.names = FALSE)


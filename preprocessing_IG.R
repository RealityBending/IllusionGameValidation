# Preprocessing Function 
preprocess_IG <- function(file) {

  json <- jsonlite::fromJSON(file)|>
        dplyr::filter(!is.na(block))
       

  data <- data.frame(#Participant = json$participant_id,
                     Illusion_Type = json$block,
                     Illusion_Strength = json$illusion_strength,
                     Illusion_Difference = json$illusion_difference,
                     Answer = json$response,
                     Correct_Ans = json$correct_response,
                     Correct = as.integer(as.logical(json$correct)),
                     RT = json$rt,
                     Trial_No = json$trial_number,
                     Block_no = json$block_number)
  
  data$Stimulus <- json$stimulus |>
                    stringr::str_remove(pattern="stimuli/") |>
                    stringr::str_remove(pattern=".png")
  
  # Total score for each type of illusion 
  ave <- aggregate(data$Correct, list(data$Illusion_Type), FUN=sum)
  ave <- setNames(ave$x, ave$Group.1)
  data <- cbind(data, as.data.frame(as.list(ave)))
  data
}


# Run ---------------------------------------------------------------------
files <- list.files(path="data/", pattern = "\\.json$", full.names = TRUE)

# Loop over each file and compute function
df <- data.frame()
for(file in files) df <- rbind(df, preprocess_IG(file))

# Clean dataframe
df
                   
                   
                 


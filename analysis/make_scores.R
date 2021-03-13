library(dplyr)
library(jsonlite)

data <- read.csv("analysis/data.csv") %>%
  dplyr::rename(Illusion_Type = Block) %>%
  dplyr::mutate(Illusion_Type = as.factor(tools::toTitleCase(Illusion_Type)),
         PlayedBefore = as.factor(PlayedBefore),
         Correct = ifelse(Correct == "TRUE", 1, 0))


# Get scores by illusions
df_scores <- data %>%
  dplyr::group_by(Illusion_Type) %>%
  dplyr::summarize(
    IES_Mean = mean(Block_IES, na.rm=TRUE),
    IES_SD = sd(Block_IES, na.rm=TRUE))

df_scores <- rbind(df_scores, data.frame(Illusion_Type = "Total",
                                   IES_Mean = mean(df_scores$IES_Mean),
                                   IES_SD = mean(df_scores$IES_SD)))

# Convert to list
scores <- list()
for(type in df_scores$Illusion_Type){
  scores[[type]] <- list()
  for(i in c("IES_Mean", "IES_SD")) {
    scores[[type]][[i]] = as.numeric(df_scores[df_scores$Illusion_Type == type, i])
  }
}



# Save as js
jsonlite::write_json(scores, "variables_scores.js")
text <-  paste("var scores =", readr::read_file("variables_scores.js"))


file <- file("variables_scores.js")
writeLines(text, file)
close(file)

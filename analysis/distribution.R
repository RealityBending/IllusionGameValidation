library(dplyr)
library(see)
library(jsonlite)
library(ggplot2)


data <- read.csv("data.csv") %>% 
  rename(Illusion_Type = Block) %>% 
  mutate(Illusion_Type = as.factor(tools::toTitleCase(Illusion_Type)),
         PlayedBefore = as.factor(PlayedBefore),
         Correct = ifelse(Correct == "TRUE", 1, 0)) 

# Convenience functions
plot_correlation_IS <- function(data, Illusion_Block){
  data %>%
    filter(Illusion_Type == Illusion_Block) %>% 
    mutate(Illusion_Strength = standardize(Illusion_Strength)) %>% 
    ggplot(aes(x=Illusion_Strength, y=RT)) +
    geom_point() +
    geom_smooth(method = "lm", alpha = 0.2) +
    ggtitle(paste("r =", insight::format_value(cor.test(data$Illusion_Strength, data$RT)$estimate), ", p =", insight::format_value(cor.test(data$Illusion_Strength, data$RT)$p.value))) +
    ylab("Reaction Time (ms)") +
    xlab("Illusion Strength") +
    ggtitle(paste0(Illusion_Block, " Illusion")) +
    theme_modern()
}

plot_correlation_ID <- function(data, Illusion_Block){
  data %>%
    filter(Illusion_Type == Illusion_Block) %>% 
    mutate(Illusion_Difference = standardize(Illusion_Difference)) %>% 
    ggplot(aes(x=Illusion_Difference, y=RT)) +
    geom_point() +
    geom_smooth(method = "lm", alpha = 0.2) +
    ggtitle(paste("r =", insight::format_value(cor.test(data$Illusion_Difference, data$RT)$estimate), ", p =", insight::format_value(cor.test(data$Illusion_Difference, data$RT)$p.value))) +
    ylab("Reaction Time (ms)") +
    xlab("Objective Feature Difference") +
    ggtitle(paste0(Illusion_Block, " Illusion")) +
    theme_modern()
}

# Plot distributions
data %>% 
  ggplot(aes(x = Block_IES, color = Illusion_Type)) +
  geom_density(size = 1, alpha=0.3) +
  labs(colour = "Illusion Type") +
  xlab("Inverse Efficiency Score") +
  theme_modern() +
  ggtitle("Distribution of IES across Illusion Type") +
  scale_fill_brewer(palette="Dark2")

plot_correlation_IS(data, "Delboeuf")
plot_correlation_IS(data, "Ebbinghaus")
plot_correlation_IS(data, "Mullerlyer")
plot_correlation_IS(data, "Ponzo")

plot_correlation_ID(data, "Delboeuf")
plot_correlation_ID(data, "Ebbinghaus")
plot_correlation_ID(data, "Mullerlyer")
plot_correlation_ID(data, "Ponzo")

# Get scores by illusions
scores_byillusion <- data %>% 
  group_by(Illusion_Type) %>% 
  summarize(IES_Mean = mean(Block_IES, na.rm=TRUE),
            IES_SD = sd(Block_IES, na.rm=TRUE),
            RT_Mean = mean(RT, na.rm=TRUE),
            RT_SD = sd(RT, na.rm=TRUE),
            Accuracy_Mean = mean(Correct, na.rm=TRUE),
            Accuracy_SD = sd(Correct, na.rm=TRUE))

Grand_IES_Mean <- mean(data$Grand_IES, na.rm=TRUE)
Grand_IES_SD <- sd(data$Grand_IES, na.rm=TRUE)
scores_grand <- as.data.frame(t(c(Grand_IES_Mean, Grand_IES_SD))) 
rownames(scores_grand) <- NULL
colnames(scores_grand) <- c("IES_Mean", "IES_SD")

# Save as js
write_json(scores_byillusion, "scores_byillusion.js")
write_json(scores_grand, "scores_grand.js")

txt_byillusion <-  readr::read_file("scores_byillusion.js") %>%
  paste("var scores_byillusion =", .)
txt_grand <-  readr::read_file("scores_grand.js") %>%
  paste("var scores_grand =", .)


file_byillusion <- file("scores_byillusion.js")
writeLines(txt_byillusion, file_byillusion)
close(file_byillusion)

file_grand <- file("scores_grand.js")
writeLines(txt_grand, file_grand)
close(file_grand)

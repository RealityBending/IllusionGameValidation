library(tidyverse)
library(easystats)

data <- read.csv("data.csv") %>% 
  rename(Illusion_Type = Block) %>% 
  mutate(Illusion_Type = as.factor(tools::toTitleCase(Illusion_Type)),
         PlayedBefore = as.factor(PlayedBefore),
         Correct = ifelse(Correct == "TRUE", 1, 0)) 

# Convenience functions
plot_correlation <- function(data, Illusion_Block){
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

# Plot distributions
data %>% 
  ggplot(aes(x = Block_IES, color = Illusion_Type)) +
  geom_density(size = 1, alpha=0.3) +
  labs(colour = "Illusion Type") +
  xlab("Inverse Efficiency Score") +
  theme_modern() +
  ggtitle("Distribution of IES across Illusion Type") +
  scale_fill_brewer(palette="Dark2")

plot_correlation(data, "Delboeuf")
plot_correlation(data, "Ebbinghaus")
plot_correlation(data, "Mullerlyer")
plot_correlation(data, "Ponzo")


# Get scores by illusions
scores <- data %>% 
  group_by(Illusion_Type) %>% 
  summarize(IES_Mean = mean(Block_IES, na.rm=TRUE),
            IES_SD = sd(Block_IES, na.rm=TRUE),
            RT_Mean = mean(RT, na.rm=TRUE),
            RT_SD = sd(RT, na.rm=TRUE),
            Accuracy_Mean = mean(Correct, na.rm=TRUE),
            Accuracy_SD = sd(Correct, na.rm=TRUE)
  )


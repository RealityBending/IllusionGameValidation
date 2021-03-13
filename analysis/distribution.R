#!/usr/bin/env Rscript

library(dplyr)
# library(see)
# library(effectsize)
# library(jsonlite)
library(ggplot2)

setwd("analysis")

data <- read.csv("data.csv") %>% 
  dplyr::mutate(Illusion_Type = as.factor(tools::toTitleCase(Illusion_Type)),
         PlayedBefore = as.factor(PlayedBefore),
         Correct = ifelse(Correct == "TRUE", 1, 0)) 

# Convenience functions
plot_correlation_IS <- function(data, Illusion_Block){
  data %>%
    dplyr::filter(Illusion_Type == Illusion_Block) %>% 
    dplyr::mutate(Illusion_Strength = effectsize::standardize(Illusion_Strength)) %>% 
    ggplot(aes(x=Illusion_Strength, y=RT)) +
    geom_point() +
    geom_smooth(method = "lm", alpha = 0.2) +
    ggtitle(paste("r =", insight::format_value(cor.test(data$Illusion_Strength, data$RT)$estimate), ", p =", insight::format_value(cor.test(data$Illusion_Strength, data$RT)$p.value))) +
    ylab("Reaction Time (ms)") +
    xlab("Illusion Strength") +
    ggtitle(paste0(Illusion_Block, " Illusion")) +
    see::theme_modern()
}

plot_correlation_ID <- function(data, Illusion_Block){
  data %>%
    dplyr::filter(Illusion_Type == Illusion_Block) %>% 
    dplyr::mutate(Illusion_Difference = effectsize::standardize(Illusion_Difference)) %>% 
    ggplot(aes(x=Illusion_Difference, y=RT)) +
    geom_point() +
    geom_smooth(method = "lm", alpha = 0.2) +
    ggtitle(paste("r =", insight::format_value(cor.test(data$Illusion_Difference, data$RT)$estimate), ", p =", insight::format_value(cor.test(data$Illusion_Difference, data$RT)$p.value))) +
    ylab("Reaction Time (ms)") +
    xlab("Objective Feature Difference") +
    ggtitle(paste0(Illusion_Block, " Illusion")) +
    see::theme_modern()
}

# Plot distributions
data %>% 
  ggplot(aes(x = Block_IES, color = Illusion_Type)) +
  geom_density(size = 1, alpha=0.3) +
  labs(colour = "Illusion Type") +
  xlab("Inverse Efficiency Score") +
  see::theme_modern() +
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


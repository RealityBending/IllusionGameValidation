library(tidyverse)
library(easystats)


for(i in c("delboeuf", "ebbinghaus", "rodframe", "verticalhorizontal", "zollner", "white", "mullerlyer", "ponzo", "poggendorff", "contrast")) {
  load(paste0("models/gam_", i, "_err.RData"))
  load(paste0("models/gam_", i, "_rt.RData"))
}




make_plot <- function(gam_err, gam_rt, diff, strength){
  prederr <- estimate_relation(gam_err, at=c(diff, "Illusion_Strength"), length=c(5, 100))
  predrt <- estimate_relation(gam_rt, at=c(diff, "Illusion_Strength"), length=c(5, 100)) |>
    mutate(Predicted = datawizard::rescale(Predicted, to=c(min(prederr$Predicted), max(prederr$Predicted))))

  ggplot(prederr, aes(x = Illusion_Strength, y=Predicted)) +
    geom_hline(yintercept=0.2, linetype="dashed") +
    geom_vline(xintercept=strength, linetype="dotted") +
    geom_line(data=predrt, aes(color=Illusion_Difference, group=Illusion_Difference), linetype="dashed", size=1) +
    geom_line(aes(color=Illusion_Difference, group=Illusion_Difference), size=1)

}

# Vertical Horizontal
make_plot(gam_verticalhorizontal_err, gam_verticalhorizontal_rt,
          diff="Illusion_Difference=c(0.05, 0.225)",
          strength=c(-33, 33))

# Muller-Lyer
make_plot(gam_mullerlyer_err, gam_mullerlyer_rt,
          diff="Illusion_Difference=c(0.05, 0.35)",
          strength=c(-23, 23))

# Ebbinghaus
make_plot(gam_ebbinghaus_err, gam_ebbinghaus_rt,
          diff="Illusion_Difference=c(0.09, 0.28)",
          strength=c(-1, 1))

# Poggendorff
summary(get_data(gam_poggendorff_err)$Illusion_Difference)
make_plot(gam_poggendorff_err, gam_poggendorff_rt,
          diff="Illusion_Difference=c(0.002, 0.17)",
          strength=c(-28, 28))



# ISI ---------------------------------------------------------------------
library(tidyverse)
library(ggdist)
library(ggside)
library(easystats)
library(patchwork)
library(brms)

df <- read.csv("../data/study2_part1.csv") |>
  rbind(read.csv("../data/study2_part2.csv")) |>
  mutate(
    Date = lubridate::dmy(Date),
    Participant = fct_reorder(Participant, Date),
    Screen_Refresh = as.character(Screen_Refresh),
    Illusion_Side = as.factor(Illusion_Side),
    Illusion_Effect = fct_relevel(as.factor(Illusion_Effect), "Incongruent", "Congruent"),
    Block = as.factor(Block)
  )



outliers <- c(
  # Error rate of 48.8% Very short RT
  # Prolific Status: REJECTED (06/08)
  "S46",
  # 2nd block of responses very fast
  # Prolific Status: REJECTED (15/08)
  "S221",
  # Error rate of 44% and very short RTs
  # Prolific Status: RETURN REQUESTED (22/08)
  "S154",
  # 2nd block bad, first block 1/3 bad
  # Prolific Status: RETURN REQUESTED (26/08)
  "S68",
  # Prolific Status: RETURN REQUESTED (26/08)
  "S238",
  # Prolific status: accepted (not enough proof)
  "S201"
)

partial_outliers <- c(
  # 2nd block a bit bad
  "S22",
  # Entire 2nd block bad
  "S235",
  # Entire 2nd block bad
  "S107",
  # Half of 2nd block bad
  "S204",
  # 2nd block not good
  "S140")


df <- filter(df, !Participant %in% outliers)


df <- df |>
  group_by(Participant, Illusion_Type, Block) |>
  mutate(ErrorRate_per_block = sum(Error) / n()) |>
  ungroup() |>
  filter(ErrorRate_per_block < 0.5) |>
  select(-ErrorRate_per_block)

# Drop also participant with bad second block
df <- filter(
  df,
  !(Participant %in% partial_outliers & df$Block == 2))


df <- df |>
  group_by(Participant, Error) |>
  mutate(Outlier = ifelse(Error == 0 & (RT < 125 | standardize(RT) > 4), TRUE, FALSE)) |>
  ungroup()
df <- filter(df, Outlier == FALSE)
df$RT <- df$RT / 1000  # Convert to second for better model convergence


m <- brms::brm(
  brms::bf(
    RT ~ s(ISI, k = 20) + (1 | Participant) + (1 | Illusion_Type)
  ),
  data = filter(df, Error == 0),
  family = "exgaussian",
  init=0,
  iter = 1000,
  algorithm="sampling"
)

data <- estimate_relation(m)

ggplot(data, aes(x = ISI, y = Predicted)) +
  geom_line(aes(color = Illusion_Type))


plot(estimate_density(runif(10000, 0, 500) + runif(10000, -500, 0)))


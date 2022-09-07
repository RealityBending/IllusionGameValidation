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

# M??ller-Lyer
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

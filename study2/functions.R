logmod <- function(x) sign(x) * log(1 + abs(x))
sqrtmod <- function(x) sign(x) * sqrt(abs(x))
cbrtmod <- function(x) sign(x) * (abs(x)**(1/3))






best_models <- function(data) {
  models_err <- list()
  models_rt <- list()
  for (k1 in c("", "_log", "_sqrt", "_cbrt")) {
    for (k2 in c("", "_log", "_sqrt", "_cbrt")) {
      for (side in c("", "--SIDE")) {
        for (effect in c("", "--EFFECT")) {
          name <- paste0("DIFF", k1, "--", "STRENGTH", k2, side, effect)
          message(name)
          f <- paste0(
            "Illusion_Difference",
            k1,
            " * Illusion_Strength",
            k2,
            " + (1|Participant)"
          )

          if (side == "--SIDE") f <- paste0("Illusion_Side * ", f)
          if (effect == "--EFFECT") f <- paste0("Illusion_Effect * ", str_replace(str_replace(f, "Illusion_Strength", "abs(Illusion_Strength"), " \\+ \\(1", "\\) \\+ \\(1"))

          m <- glmmTMB::glmmTMB(as.formula(paste0("Error ~ ", f)),
                                data = data, family = "binomial"
          )
          if (performance::check_convergence(m)) {
            models_err[[name]] <- m
          }

          m <- glmmTMB::glmmTMB(as.formula(paste0("RT ~ ", f)),
                                data = filter(data, Error == 0)
          )
          if (performance::check_convergence(m)) {
            models_rt[[name]] <- m
          }
        }
      }
    }
  }

  # RT
  to_keep <- compare_performance(models_rt, metrics = c("BIC")) |>
    arrange(BIC) |>
    slice(1:5) |>
    pull(Name)

  test <- test_performance(models_rt[to_keep], reference = 1)
  perf <- compare_performance(models_rt[to_keep], metrics = c("BIC", "R2"))
  rt <- merge(perf, test) |>
    arrange(BIC) |>
    select(Name, BIC, R2_marginal, BF) |>
    mutate(
      BF = insight::format_bf(BF, name = ""),
      Model = "RT"
    )

  # Errors
  to_keep <- compare_performance(models_err, metrics = c("BIC")) |>
    arrange(BIC) |>
    slice(1:5) |>
    pull(Name)

  test <- test_performance(models_err[to_keep], reference = 1)
  perf <- compare_performance(models_err[to_keep], metrics = c("BIC", "R2"))

  merge(perf, test) |>
    arrange(BIC) |>
    select(Name, BIC, R2_marginal, BF) |>
    mutate(
      BF = insight::format_bf(BF, name = ""),
      Model = "Errors"
    ) |>
    rbind(rt)
}





















plot_descriptive_err <- function(data, side = "leftright") {
  # Sanity checks
  if (length(unique(data$Illusion_Difference)) != 8) stop("Illusion_Difference values != 8")
  if (length(unique(data$Illusion_Strength)) != 15) stop("Illusion_Strength values != 15")

  if (side == "leftright") {
    x <- data[data$Error == 0 & data$Illusion_Side == 1, ]$Answer[1]
    x <- tools::toTitleCase(gsub("arrow", "", x))
    if (x == "Left") {
      data$Answer <- ifelse(data$Illusion_Side == 1, "Left", "Right")
    } else if (x == "Right") {
      data$Answer <- ifelse(data$Illusion_Side == 1, "Right", "Left")
    }
  } else {
    x <- data[data$Error == 0 & data$Illusion_Side == 1, ]$Answer[1]
    x <- tools::toTitleCase(gsub("arrow", "", x))
    if (x == "Up") {
      data$Answer <- ifelse(data$Illusion_Side == 1, "Up", "Down")
    } else if (x == "Down") {
      data$Answer <- ifelse(data$Illusion_Side == 1, "Down", "Up")
    }
    data$Answer <- fct_rev(data$Answer)
  }

  dodge1 <- 0.1 * diff(range(data$Illusion_Difference))
  dodge2 <- -0.1 * diff(range(data$Illusion_Strength))

  p1 <- data |>
    group_by(Illusion_Difference, Illusion_Strength, Answer) |>
    summarize(Error = mean(Error), .groups = "drop") |>
    ungroup() |>
    ggplot(aes(x = Illusion_Difference, y = Error)) +
    geom_bar(aes(fill = Illusion_Strength, group = Illusion_Strength), position = position_dodge(width = dodge1, preserve = "single"), stat = "identity", width = dodge1) +
    # geom_line(aes(color = Illusion_Strength, group=Illusion_Strength), position = position_dodge(width=dodge1)) +
    geom_hline(yintercept = 0.5, linetype = "dotted", alpha = 0.3) +
    scale_y_continuous(limits = c(0, 1), expand = c(0, 0), labels = scales::percent) +
    scale_x_continuous(expand = c(0, 0)) +
    scale_fill_gradientn(colours = c("#4CAF50", "#009688", "#00BCD4", "#2196F3", "#3F51B5", "#673AB7", "#9C27B0")) +
    theme_modern() +
    labs(
      color = "Illusion Strength",
      fill = "Illusion Strength",
      y = "Probability of Error",
      x = "Task Difficulty"
    ) +
    theme(plot.title = element_text(face = "bold", hjust = 0.5))


  p2 <- data |>
    group_by(Illusion_Difference, Illusion_Strength, Answer) |>
    summarize(Error = mean(Error), .groups = "drop") |>
    ungroup() |>
    # mutate(Illusion_Difference = as.factor(round(Illusion_Difference, 4))) |>
    ggplot(aes(x = Illusion_Strength, y = Error)) +
    geom_hline(yintercept = 0.5, linetype = "dotted", alpha = 0.3) +
    geom_vline(xintercept = 0, linetype = "dashed", alpha = 0.6) +
    geom_bar(aes(fill = Illusion_Difference, group = Illusion_Difference), position = position_dodge(width = dodge2, preserve = "single"), stat = "identity", width = dodge2) +
    # geom_line(aes(color = Illusion_Difference), position = position_dodge(width=dodge2)) +
    scale_y_continuous(limits = c(0, 1), expand = c(0, 0), labels = scales::percent) +
    scale_x_continuous(expand = c(0, 0)) +
    scale_fill_gradientn(colours = c("#F44336", "#FFC107", "#4CAF50")) +
    theme_modern() +
    labs(
      color = "Task Difficulty",
      fill = "Task Difficulty",
      y = "Probability of Error",
      x = "Illusion Strength"
    ) +
    theme(plot.title = element_text(face = "bold", hjust = 0.5))

  if (side == "leftright") {
    p <- ((p1 + facet_wrap(~Answer, ncol = 2, labeller = "label_both")) /
            (p2 + facet_wrap(~Answer, ncol = 2, labeller = "label_both"))) +
      plot_annotation(
        title = paste(data$Illusion_Type[1], "Illusion"),
        theme = theme(plot.title = element_text(face = "bold", hjust = 0.5))
      )
  } else {
    p <- ((p1 + facet_wrap(~Answer, nrow = 2, labeller = "label_both")) |
            (p2 + facet_wrap(~Answer, nrow = 2, labeller = "label_both"))) +
      plot_annotation(
        title = paste(data$Illusion_Type[1], "Illusion"),
        theme = theme(plot.title = element_text(face = "bold", hjust = 0.5))
      )
  }
  p
}





plot_model_err <- function(data, model) {
  data <- mutate(data, .dots_side = ifelse(Error == 1, "bottom", "top"))

  # Get variables
  vars <- insight::find_predictors(model)$conditional
  vardiff <- vars[1]
  varstrength <- vars[2]

  # Get predicted
  pred <- estimate_relation(model,
                            at = vars,
                            length = c(NA, 50)
  )

  # Set colors for lines
  colors <- colorRampPalette(c("#F44336", "#FFC107", "#4CAF50"))(length(unique(data[[vardiff]])))
  diffvals <- as.numeric(as.character(unique(sort(pred[[vardiff]]))))
  names(colors) <- diffvals

  # Assign color from the same palette to every observation of data (for geom_dots)
  closest <- diffvals[max.col(-abs(outer(data[[vardiff]], diffvals, "-")))]
  data$color <- colors[as.character(closest)]
  data$color <- fct_reorder(data$color, closest)

  # Manual jittering
  xrange <- 0.03 * diff(range(data[[varstrength]]))
  data$x <- data[[varstrength]]
  data$x[data$x > 0] <- data$x[data$x > 0] - runif(sum(data$x > 0), 0, xrange)
  data$x[data$x < 0] <- data$x[data$x < 0] + runif(sum(data$x < 0), 0, xrange)
  data$x[round(data$x, 2) == 0] <- data$x[round(data$x, 2) == 0] + runif(sum(round(data$x, 2) == 0), -xrange / 2, xrange / 2)

  # Remove first stim of strength 0
  data <- filter(data, !(Block == 1 & Illusion_Strength == 0))

  pred |>
    ggplot(aes_string(x = varstrength, y = "Predicted")) +
    geom_dots(
      data = data,
      aes(
        x = x,
        y = Error,
        group = Error,
        side = .dots_side,
        # order=as.numeric(color) * ifelse(Error == 1, 1, -1)),
        order = color
      ),
      fill = data$color,
      color = NA,
      alpha = 0.5
    ) +
    geom_ribbon(aes_string(ymin = "CI_low", ymax = "CI_high", fill = vardiff, group = vardiff), alpha = 0.2) +
    geom_vline(xintercept = 0, linetype = "dashed") +
    geom_hline(yintercept = c(0.5), linetype = "dotted", alpha = 0.5) +
    geom_line(aes_string(color = vardiff, group = vardiff)) +
    scale_y_continuous(limits = c(0, 1), expand = c(0, 0), labels = scales::percent) +
    scale_x_continuous(expand = c(0, 0)) +
    scale_color_gradientn(colours = c("#F44336", "#FFC107", "#4CAF50")) +
    scale_fill_gradientn(colours = c("#F44336", "#FFC107", "#4CAF50")) +
    coord_cartesian(xlim = c(min(data[[varstrength]]), max(data[[varstrength]]))) +
    theme_modern() +
    labs(
      title = paste0(data$Illusion_Type[1], " Illusion"),
      color = "Difficulty", fill = "Difficulty",
      y = "Probability of Error",
      x = "Illusion Strength"
    ) +
    theme(plot.title = element_text(face = "bold", hjust = 0.5))
}





plot_descriptive_rt <- function(data, side = "leftright") {

  if (side == "leftright") {
    x <- data[data$Error == 0 & data$Illusion_Side == 1, ]$Answer[1]
    x <- tools::toTitleCase(gsub("arrow", "", x))
    if (x == "Left") {
      data$Answer <- ifelse(data$Illusion_Side == 1, "Left", "Right")
    } else if (x == "Right") {
      data$Answer <- ifelse(data$Illusion_Side == 1, "Right", "Left")
    }
  } else {
    x <- data[data$Error == 0 & data$Illusion_Side == 1, ]$Answer[1]
    x <- tools::toTitleCase(gsub("arrow", "", x))
    if (x == "Up") {
      data$Answer <- ifelse(data$Illusion_Side == 1, "Up", "Down")
    } else if (x == "Down") {
      data$Answer <- ifelse(data$Illusion_Side == 1, "Down", "Up")
    }
    data$Answer <- fct_rev(data$Answer)
  }

  dodge1 <- 0.1 * diff(range(data$Illusion_Difference))
  dodge2 <- -0.1 * diff(range(data$Illusion_Strength))

  p1 <- data |>
    ggplot(aes(x = Illusion_Difference, y = RT)) +
    ggdist::stat_slabinterval(aes(fill = Illusion_Strength, group = Illusion_Strength, color = Illusion_Strength), alpha = 0.5, normalize = "groups", position=position_dodge(width=dodge1)) +
    # geom_line(aes(color = Illusion_Strength), position = position_dodge(width=dodge1)) +
    scale_y_continuous(expand = c(0, 0)) +
    scale_x_continuous(expand = c(0, 0)) +
    scale_color_gradientn(colours = c("#4CAF50", "#009688", "#00BCD4", "#2196F3", "#3F51B5", "#673AB7", "#9C27B0")) +
    scale_fill_gradientn(colours = c("#4CAF50", "#009688", "#00BCD4", "#2196F3", "#3F51B5", "#673AB7", "#9C27B0")) +
    coord_cartesian(ylim = c(125, 3000) / 1000) +
    theme_modern() +
    labs(
      color = "Illusion Strength",
      fill = "Illusion Strength",
      y = "Reaction Time (ms)",
      x = "Task Difficulty"
    ) +
    theme(plot.title = element_text(face = "bold", hjust = 0.5))

  p2 <- data |>
    ggplot(aes(x = Illusion_Strength, y = RT)) +
    geom_vline(xintercept = 0, linetype = "dashed", alpha = 0.6) +
    ggdist::stat_slabinterval(aes(fill = Illusion_Difference, group = Illusion_Difference, color = Illusion_Difference), alpha = 0.5, normalize = "groups", position=position_dodge(width=dodge2)) +
    # geom_line(aes(color = Illusion_Difference), position = position_dodge(width=dodge2)) +
    scale_y_continuous(expand = c(0, 0)) +
    scale_x_continuous(expand = c(0, 0)) +
    scale_color_gradientn(colours = c("#F44336", "#FFC107", "#4CAF50")) +
    scale_fill_gradientn(colours = c("#F44336", "#FFC107", "#4CAF50")) +
    coord_cartesian(ylim = c(125, 3000) / 1000) +
    theme_modern() +
    labs(
      color = "Task Difficulty",
      fill = "Task Difficulty",
      y = "Reaction Time (s)",
      x = "Illusion Strength"
    ) +
    theme(plot.title = element_text(face = "bold", hjust = 0.5))

  if (side == "leftright") {
    p <- ((p1 + facet_wrap(~Answer, ncol = 2, labeller = "label_both")) /
            (p2 + facet_wrap(~Answer, ncol = 2, labeller = "label_both"))) +
      plot_annotation(
        title = paste(data$Illusion_Type[1], "Illusion"),
        theme = theme(plot.title = element_text(face = "bold", hjust = 0.5))
      )
  } else {
    p <- ((p1 + facet_wrap(~Answer, nrow = 2, labeller = "label_both")) |
            (p2 + facet_wrap(~Answer, nrow = 2, labeller = "label_both"))) +
      plot_annotation(
        title = paste(data$Illusion_Type[1], "Illusion"),
        theme = theme(plot.title = element_text(face = "bold", hjust = 0.5))
      )
  }
  p
}



plot_ppcheck <- function(model) {
  pred <- modelbased::estimate_prediction(model, keep_iterations = 100)
  estimate_density(pred$RT) |>
    ggplot(aes(x = x, y = y)) +
    geom_area(fill = "#9E9E9E") +
    geom_line(
      data = pred |>
        bayestestR::reshape_iterations() |>
        mutate(iter_group = as.factor(iter_group)) |>
        estimate_density(select = "iter_value", at = "iter_group"),
      aes(group = iter_group), color = "#2196F3", size = 0.1, alpha = 0.5
    ) +
    scale_y_continuous(expand = c(0, 0)) +
    scale_x_continuous(expand = c(0, 0)) +
    # coord_cartesian(xlim = c(100, 3000)) +
    theme_modern() +
    labs(x = "Reaction Time (ms)", y = "", title = "Posterior Predictive Check") +
    theme(
      plot.title = element_text(face = "bold", hjust = 0.5),
      axis.text.y = element_blank()
    )
}





plot_model_rt <- function(data, model) {
  data <- mutate(data, .dots_side = ifelse(Error == 1, "bottom", "top"))

  # Get variables
  vars <- insight::find_predictors(model)$conditional
  vardiff <- vars[1]
  varstrength <- vars[2]

  # Get predicted
  pred <- estimate_relation(model,
                            at = vars,
                            length = c(NA, 25)
  )

  # Set colors for lines
  colors <- colorRampPalette(c("#F44336", "#FFC107", "#4CAF50"))(length(unique(data[[vardiff]])))
  diffvals <- as.numeric(as.character(unique(sort(pred[[vardiff]]))))
  names(colors) <- diffvals

  # Assign color from the same palette to every observation of data (for geom_dots)
  closest <- diffvals[max.col(-abs(outer(data[[vardiff]], diffvals, "-")))]
  data$color <- colors[as.character(closest)]
  data$color <- fct_reorder(data$color, closest)

  p <- pred |>
    ggplot(aes_string(x = varstrength, y = "Predicted")) +
    ggdist::stat_slab(data = data, aes_string(y = "RT", group = vardiff, fill = vardiff), alpha = 0.5) +
    geom_ribbon(aes_string(ymin = "CI_low", ymax = "CI_high", fill = vardiff, group = vardiff), alpha = 0.2) +
    geom_vline(xintercept = 0, linetype = "dashed") +
    geom_line(aes_string(color = vardiff, group = vardiff)) +
    scale_y_continuous(expand = c(0, 0)) +
    scale_x_continuous(expand = c(0, 0)) +
    scale_color_gradientn(colours = c("#F44336", "#FFC107", "#4CAF50")) +
    scale_fill_gradientn(colours = c("#F44336", "#FFC107", "#4CAF50")) +
    coord_cartesian(
      xlim = c(min(data[[varstrength]]), max(data[[varstrength]])),
      ylim = c(125, 1500) / 1000
    ) +
    theme_modern() +
    labs(
      title = paste0(data$Illusion_Type[1], " Illusion"),
      color = "Difficulty", fill = "Difficulty",
      y = "Reaction Time (s)",
      x = "Illusion Strength"
    ) +
    theme(plot.title = element_text(face = "bold", hjust = 0.5))
}







plot_all <- function(data, p_err, p_rt) {
  # Get stimuli
  dat <- df |>
    filter(Error == 0) |>
    filter(
      Illusion_Type == unique(data$Illusion_Type),
      Answer %in% c("arrowleft", "arrowup")
    ) |>
    select(Stimulus, Illusion_Strength, Illusion_Difference)

  dat <- rbind(
    filter(dat, Illusion_Strength == min(Illusion_Strength)) |>
      filter(Illusion_Difference %in% c(min(Illusion_Difference), max(Illusion_Difference))),
    filter(dat, Illusion_Strength == max(Illusion_Strength)) |>
      filter(Illusion_Difference %in% c(min(Illusion_Difference), max(Illusion_Difference))),
    filter(dat, Illusion_Difference == min(Illusion_Difference)) |>
      filter(Illusion_Strength %in% c(min(Illusion_Strength), max(Illusion_Strength))),
    filter(dat, Illusion_Difference == max(Illusion_Difference)) |>
      filter(Illusion_Strength %in% c(min(Illusion_Strength), max(Illusion_Strength)))
  )


  img_leftdown <- filter(dat, Illusion_Difference == max(Illusion_Difference)) |>
    filter(Illusion_Strength == min(Illusion_Strength)) |>
    pull(Stimulus) |>
    unique()
  img_rightdown <- filter(dat, Illusion_Difference == max(Illusion_Difference)) |>
    filter(Illusion_Strength == max(Illusion_Strength)) |>
    pull(Stimulus) |>
    unique()
  img_leftup <- filter(dat, Illusion_Strength == min(Illusion_Strength)) |>
    filter(Illusion_Difference == min(Illusion_Difference)) |>
    pull(Stimulus) |>
    unique()
  img_rightup <- filter(dat, Illusion_Strength == max(Illusion_Strength)) |>
    filter(Illusion_Difference == min(Illusion_Difference)) |>
    pull(Stimulus) |>
    unique()


  img_leftdown <- paste0("stimuli/", img_leftdown, ".png") |>
    png::readPNG() |>
    grid::rasterGrob(interpolate = TRUE) |>
    patchwork::wrap_elements()
  img_rightdown <- paste0("stimuli/", img_rightdown, ".png") |>
    png::readPNG() |>
    grid::rasterGrob(interpolate = TRUE) |>
    patchwork::wrap_elements()
  img_leftup <- paste0("stimuli/", img_leftup, ".png") |>
    png::readPNG() |>
    grid::rasterGrob(interpolate = TRUE) |>
    patchwork::wrap_elements()
  img_rightup <- paste0("stimuli/", img_rightup, ".png") |>
    png::readPNG() |>
    grid::rasterGrob(interpolate = TRUE) |>
    patchwork::wrap_elements()

  p <- ((p_err + labs(x = "")) / (p_rt + labs(title = "")) + patchwork::plot_layout(guides = "collect"))

  # (
  #   (img_leftup / patchwork::plot_spacer() / img_leftdown + patchwork::plot_layout(heights = c(0.5, 2, 0.5))) |
  #   (patchwork::plot_spacer() / p / patchwork::plot_spacer()  + patchwork::plot_layout(heights = c(0.5, 2, 0.5))) |
  #   (img_rightup / patchwork::plot_spacer() / img_rightdown  + patchwork::plot_layout(heights = c(0.5, 2, 0.5)))
  #   ) +
  #   patchwork::plot_layout(widths = c(0.5, 1, 0.5))

  (img_leftup | patchwork::plot_spacer() | img_rightup) / p / (img_leftdown | patchwork::plot_spacer() | img_rightdown) +
    patchwork::plot_layout(heights = c(0.5, 1.5, 0.5))
}




extract_random <- function(model, illusion = "Delboeuf") {
  random <- as.data.frame(model)
  random <- random[str_detect(names(random), regex("^r_Participant"))]

  if (insight::model_info(model)$is_logit) {
    param <- "Prob,"
  } else {
    param <- "Loc,"
  }

  random |>
    mutate(Draw = 1:nrow(random)) |>
    pivot_longer(-Draw, names_to = "Parameter", values_to = "Value") |>
    mutate(
      Parameter = str_remove(Parameter, "r_Participant"),
      Parameter = str_remove(Parameter, "\\]"),
      Parameter = str_remove(Parameter, "\\["),
      Parameter = str_remove(Parameter, "logmodabs"),
      Parameter = str_remove(Parameter, "logmod"),
      Parameter = str_remove(Parameter, "sqrtabs"),
      Parameter = str_remove(Parameter, "sqrt"),
      Parameter = str_remove(Parameter, "cbrtabs"),
      Parameter = str_remove(Parameter, "cbrt"),
      Parameter = paste0(param, Parameter),
      Parameter = str_replace(Parameter, paste0(param, "__sigma"), "Disp,")
    ) |>
    separate(Parameter, into = c("Component", "Participant", "Parameter"), sep = ",") |>
    mutate(
      Parameter = paste0(Parameter, "_", Component),
      Illusion_Type = illusion
    ) |>
    mutate(
      Parameter = str_replace(Parameter, "Illusion_Strength", "Illu"),
      Parameter = str_replace(Parameter, "Illusion_Difference", "Diff"),
      Parameter = str_replace(Parameter, "Illusion_EffectCongruent", "Cong"),
      Parameter = str_replace_all(Parameter, ":", "")
    )
}

library(ggplot2)
library(gganimate)
library(mgcv)

df <- MASS::mcycle

m_lm <- lm(accel ~ times, data=df)
m_poly2 <- lm(accel ~ poly(times, 2), data=df)
m_poly3 <- lm(accel ~ poly(times, 3), data=df)
m_poly5 <- lm(accel ~ poly(times, 5), data=df)
m_poly7 <- lm(accel ~ poly(times, 7), data=df)
m_gam <- gam(accel ~ s(times), data=df)

# series of measurements of head acceleration in a simulated motorcycle accident, used to test crash helmets.
p <- ggplot(df, aes(x=times, y=Predicted)) +
  geom_point(aes(y=accel)) +
  see::theme_modern() +
  labs(x = "Time after impact (ms)", y = "Acceleration (g)", color="Models") +
  scale_color_manual(values=c("Linear" = "black", "Poly (2)" = "#FFC107", "Poly (3)" = "#FF9800", "Poly (5)" = "#FF5722", "Poly (7)" = "#F44336", "GAM" = "#2196F3")) +
  geom_line(data=modelbased::estimate_relation(m_lm), aes(color = "Linear")) +
  geom_line(data=modelbased::estimate_relation(m_poly2, length=100), aes(color = "Poly (2)")) +
  geom_line(data=modelbased::estimate_relation(m_poly3, length=100), aes(color = "Poly (3)")) +
  geom_line(data=modelbased::estimate_relation(m_poly5, length=100), aes(color = "Poly (5)")) +
  geom_line(data=modelbased::estimate_relation(m_poly7, length=100), aes(color = "Poly (7)")) +
  geom_line(data=modelbased::estimate_relation(m_gam, length=100), aes(color = "GAM"), size=2) +
  transition_layers() + enter_fade()


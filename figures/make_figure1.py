import pyllusion as ill

ill.MullerLyer(illusion_strength=45, difference=0).to_image(width=500, height=500).save(
    "MullerLyer_0.png"
)
ill.MullerLyer(illusion_strength=60, difference=1).to_image(width=500, height=500).save(
    "MullerLyer_1.png"
)
ill.MullerLyer(illusion_strength=-60, difference=1).to_image(width=500, height=500).save(
    "MullerLyer_2.png"
)
ill.MullerLyer(illusion_strength=10, difference=0.25).to_image(width=500, height=500).save(
    "MullerLyer_3.png"
)
ill.MullerLyer(illusion_strength=-10, difference=0.25).to_image(width=500, height=500).save(
    "MullerLyer_4.png"
)

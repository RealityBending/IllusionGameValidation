# -*- coding: utf-8 -*-
import json

import numpy as np
import pandas as pd
import pyllusion as ill

# Parameters
width = 800
height = 800
n = 2
data = []


# Convenience functions
def save_mosaic(strengths, differences, function, name="Delboeuf"):
    imgs = []
    for strength in [abs(min(strengths, key=abs)), max(strengths)]:
        if name == "Ponzo":
            strength = -strength  # negative value for facilitating illusion
        for difference in [abs(min(differences, key=abs)), max(differences)]:

            img = function(illusion_strength=strength, difference=difference).to_image(
                width=width, height=height
            )
            img = ill.image_text(
                "Difference: "
                + str(np.round(difference, 2))
                + ", Strength: "
                + str(np.round(strength, 2)),
                y=0.88,
                size=40,
                image=img,
            )
            imgs.append(img)
    img = ill.image_mosaic(imgs, ncols=2)
    img = ill.image_line(length=2, rotate=0, image=img)
    img = ill.image_line(length=2, rotate=90, image=img)
    img.save("utils/stimuli_examples/" + name + "_Mosaic.png")
    return img


def generate_images(data, strengths, differences, function, name="Delboeuf"):

    for strength in strengths:
        for difference in differences:

            img = function(illusion_strength=strength, difference=difference).to_image(
                width=width, height=height
            )
            path = (
                name
                + "_str"
                + str(np.round(strength, 2))
                + "_diff"
                + str(np.round(difference, 2))
                + ".png"
            )
            img.save("stimuli/" + path)

            # Compute expected response
            if name in ["Delboeuf", "Ebbinghaus", "VerticalHorizontal", "White"]:
                if difference > 0:
                    correct = "arrowleft"
                else:
                    correct = "arrowright"
            elif name in ["MullerLyer", "Contrast", "Poggendorff", "Ponzo"]:
                if difference > 0:
                    correct = "arrowup"
                else:
                    correct = "arrowdown"
            elif name in ["Zollner", "RodFrame"]:
                if difference < 0:
                    correct = "arrowleft"
                else:
                    correct = "arrowright"

            # Save parameters for Delboeuf Illusion
            data.append(
                {
                    "Illusion_Type": name,
                    "Illusion_Strength": strength,
                    "Difference": difference,
                    "stimulus": "stimuli/" + path,
                    "data": {"screen": "Trial", "block": name, "correct_response": correct},
                }
            )

    save_mosaic(strengths, differences, function, name=name)
    return data


# -------------------------- Demo Illusions for Instructions --------------------------

# Left-right
ill.Delboeuf(illusion_strength=1, difference=5).to_image(width=800, height=600).save(
    "utils/stimuli_demo/Delboeuf_Demo.png"
)
ill.Ebbinghaus(illusion_strength=1, difference=5).to_image(width=800, height=600).save(
    "utils/stimuli_demo/Ebbinghaus_Demo.png"
)

ill.Zollner(illusion_strength=20, difference=-10).to_image(width=800, height=600).save(
    "utils/stimuli_demo/Zollner_Demo.png"
)
ill.VerticalHorizontal(illusion_strength=45, difference=1).to_image(width=800, height=600).save(
    "utils/stimuli_demo/VerticalHorizontal_Demo.png"
)
ill.RodFrame(illusion_strength=5, difference=-30).to_image(width=800, height=600).save(
    "utils/stimuli_demo/RodFrame_Demo.png"
)


# Up-Down
ill.MullerLyer(illusion_strength=20, difference=1).to_image(width=800, height=600).save(
    "utils/stimuli_demo/MullerLyer_Demo.png"
)
ill.Ponzo(illusion_strength=5, difference=2.0).to_image(width=800, height=600).save(
    "utils/stimuli_demo/Ponzo_Demo.png"
)

ill.Poggendorff(illusion_strength=20, difference=0.3).to_image(width=800, height=600).save(
    "utils/stimuli_demo/Poggendorff_Demo.png"
)

# Contrast
ill.Contrast(illusion_strength=0, difference=30).to_image(width=800, height=600).save(
    "utils/stimuli_demo/Contrast_Demo.png"
)
ill.White(illusion_strength=5, difference=50).to_image(width=800, height=600).save(
    "utils/stimuli_demo/White_Demo.png"
)


# -------------------------- Delboeuf Illusion --------------------------
data = generate_images(
    data,
    strengths=np.linspace(-1, 1, num=n),
    differences=np.linspace(-1, 1, num=n),
    function=ill.Delboeuf,
    name="Delboeuf",
)

# -------------------------- MullerLyer Illusion --------------------------
data = generate_images(
    data,
    strengths=np.linspace(-50, 50, num=n),
    differences=np.linspace(-0.3, 0.3, num=n),
    function=ill.MullerLyer,
    name="MullerLyer",
)

# -------------------------- Ebbinghaus Illusion --------------------------
data = generate_images(
    data,
    strengths=np.linspace(-1, 1, num=n),
    differences=np.linspace(-1, 1, num=n),
    function=ill.Ebbinghaus,
    name="Ebbinghaus",
)

# -------------------------- Ponzo Illusion --------------------------
data = generate_images(
    data,
    strengths=np.linspace(-20, 20, num=n),
    differences=np.linspace(-0.3, 0.3, num=n),
    function=ill.Ponzo,
    name="Ponzo",
)

# -------------------------- Zollner Illusion --------------------------
data = generate_images(
    data,
    strengths=np.linspace(-70, 70, num=n),
    differences=np.linspace(-7, 7, num=n),
    function=ill.Zollner,
    name="Zollner",
)

# -------------------------- Contrast Illusion --------------------------
data = generate_images(
    data,
    strengths=np.linspace(-50, 50, num=n),
    differences=np.linspace(-40, 40, num=n),
    function=ill.Contrast,
    name="Contrast",
)

# -------------------------- Rod Frame Illusion -------------------------- (revise again?)
data = generate_images(
    data,
    strengths=np.linspace(-30, 30, num=n),
    differences=np.linspace(-20, 20, num=n),
    function=ill.RodFrame,
    name="RodFrame",
)

# -------------------------- Poggendorff Illusion --------------------------
data = generate_images(
    data,
    strengths=np.linspace(25, 55, num=n),  # sign does not change feature
    differences=np.linspace(-0.3, 0.3, num=n),
    function=ill.Poggendorff,
    name="Poggendorff",
)

# -------------------------- Vertical Horizontal Illusion --------------------------
data = generate_images(
    data,
    strengths=np.linspace(-90, 90, num=n),
    differences=np.linspace(-0.3, 0.3, num=n),
    function=ill.VerticalHorizontal,
    name="VerticalHorizontal",
)


# -------------------------- White Illusion --------------------------
data = generate_images(
    data,
    strengths=np.linspace(-30, 30, num=n),
    differences=np.linspace(-40, 40, num=n),
    function=ill.White,
    name="White",
)


# -------------------------- Save data --------------------------
# 1. Save data to a javascript file
with open("stimuli/stimuli.js", "w") as fp:
    json.dump(data, fp)

# 2. Re-read and add "var test_stimuli ="
with open("stimuli/stimuli.js") as f:
    updatedfile = "var stimuli = " + f.read()
with open("stimuli/stimuli.js", "w") as f:
    f.write(updatedfile)

# -*- coding: utf-8 -*-
import glob
import json
import os

import neurokit2 as nk
import numpy as np
import pandas as pd
import pyllusion as ill

# Parameters
width = 800
height = 800
n = 8
data = []

# Delete all existing stimuli
for f in glob.glob("stimuli/*"):
    os.remove(f)

# Convenience functions
def save_mosaic(strengths, differences, function, name="Delboeuf", **kwargs):
    imgs = []
    for strength in [abs(min(strengths, key=abs)), max(strengths)]:
        for difference in [abs(min(differences, key=abs)), max(differences)]:

            img = function(illusion_strength=strength, difference=difference, **kwargs).to_image(
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


def generate_images(data, strengths, differences, function, name="Delboeuf", **kwargs):

    for strength in strengths:
        for difference in differences:

            img = function(illusion_strength=strength, difference=difference, **kwargs).to_image(
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

    save_mosaic(strengths, differences, function, name=name, **kwargs)
    return data


def sqrtspace(mini=0.1, maxi=1, size=6):
    x = np.linspace(np.sqrt(0), np.sqrt(1), int(size / 2) + 1, endpoint=True) ** 2
    x = nk.rescale(x[1::], [mini, maxi])
    return np.concatenate((-1 * x[::-1], x))


def doublelinspace(mini=0.1, maxi=1, size=6):
    x = np.linspace(mini, maxi, int(size / 2), endpoint=True)
    return np.concatenate((-1 * x[::-1], x))


# =============================================================================
# STUDY 1
# =============================================================================


# Left-right ======================================================================================
# -------------------------- Delboeuf Illusion --------------------------
ill.Delboeuf(illusion_strength=0.8, difference=1.2).to_image(width=800, height=600).save(
    "utils/stimuli_demo/Delboeuf_Demo.png"
)
data = generate_images(
    data,
    strengths=np.linspace(-2.1, 2.1, n - 1),
    differences=doublelinspace(mini=0.08, maxi=0.8, size=n),
    function=ill.Delboeuf,
    name="Delboeuf",
    distance=0.9,  # Distance between circles
)

# -------------------------- Ebbinghaus Illusion --------------------------
ill.Ebbinghaus(illusion_strength=0.1, difference=1.5).to_image(width=800, height=600).save(
    "utils/stimuli_demo/Ebbinghaus_Demo.png"
)
data = generate_images(
    data,
    strengths=np.linspace(-2.1, 2.1, n - 1),
    differences=doublelinspace(mini=0.08, maxi=0.8, size=n),
    function=ill.Ebbinghaus,
    name="Ebbinghaus",
    distance=0.9,  # Distance between circles
)
# -------------------------- Rod Frame Illusion --------------------------
ill.RodFrame(illusion_strength=5, difference=-30).to_image(width=800, height=600).save(
    "utils/stimuli_demo/RodFrame_Demo.png"
)
data = generate_images(
    data,
    strengths=np.linspace(-20, 20, num=n - 1),
    differences=doublelinspace(mini=0.05, maxi=8, size=n),
    function=ill.RodFrame,
    name="RodFrame",
)
# -------------------------- Vertical Horizontal Illusion --------------------------
ill.VerticalHorizontal(illusion_strength=45, difference=1).to_image(width=800, height=600).save(
    "utils/stimuli_demo/VerticalHorizontal_Demo.png"
)
data = generate_images(
    data,
    strengths=np.linspace(-90, 90, num=n - 1),
    differences=doublelinspace(mini=0.03, maxi=0.3, size=n),
    function=ill.VerticalHorizontal,
    name="VerticalHorizontal",
)
# -------------------------- White Illusion --------------------------
ill.White(illusion_strength=5, difference=50).to_image(width=800, height=600).save(
    "utils/stimuli_demo/White_Demo.png"
)
data = generate_images(
    data,
    strengths=np.linspace(-25, 25, num=n - 1),
    differences=doublelinspace(mini=5, maxi=20, size=n),
    function=ill.White,
    name="White",
)
# -------------------------- Zollner Illusion --------------------------
ill.Zollner(illusion_strength=-20, difference=-8).to_image(width=800, height=600).save(
    "utils/stimuli_demo/Zollner_Demo.png"
)
data = generate_images(
    data,
    strengths=np.linspace(-85, 85, num=n - 1),
    differences=doublelinspace(mini=0.2, maxi=5, size=n),
    function=ill.Zollner,
    name="Zollner",
)

# Up-Down ======================================================================================
# -------------------------- MullerLyer Illusion --------------------------
ill.MullerLyer(illusion_strength=10, difference=0.5).to_image(width=800, height=600).save(
    "utils/stimuli_demo/MullerLyer_Demo.png"
)
data = generate_images(
    data,
    strengths=np.linspace(-50, 50, num=n - 1),
    differences=doublelinspace(mini=0.05, maxi=0.5, size=n),
    function=ill.MullerLyer,
    name="MullerLyer",
)


# -------------------------- Ponzo Illusion --------------------------
ill.Ponzo(illusion_strength=5, difference=0.6).to_image(width=800, height=600).save(
    "utils/stimuli_demo/Ponzo_Demo.png"
)
data = generate_images(
    data,
    strengths=np.linspace(-25, 25, num=n - 1),
    differences=doublelinspace(mini=0.04, maxi=0.4, size=n),
    function=ill.Ponzo,
    name="Ponzo",
)
# -------------------------- Contrast Illusion --------------------------
ill.Contrast(illusion_strength=-5, difference=30).to_image(width=800, height=600).save(
    "utils/stimuli_demo/Contrast_Demo.png"
)
data = generate_images(
    data,
    strengths=np.linspace(-36, 36, num=n - 1),
    differences=doublelinspace(mini=5, maxi=20, size=n),
    function=ill.Contrast,
    name="Contrast",
)
# -------------------------- Poggendorff Illusion --------------------------
ill.Poggendorff(illusion_strength=20, difference=0.3).to_image(width=800, height=600).save(
    "utils/stimuli_demo/Poggendorff_Demo.png"
)
data = generate_images(
    data,
    strengths=np.linspace(-66, 66, num=n - 1),
    differences=doublelinspace(mini=0.03, maxi=0.3, size=n),
    function=ill.Poggendorff,
    name="Poggendorff",
)

# =============================================================================
# STUDY 2
# =============================================================================


# -------------------------- Save data --------------------------
# 1. Save data to a javascript file
with open("stimuli/stimuli.js", "w") as fp:
    json.dump(data, fp)

# 2. Re-read and add "var test_stimuli ="
with open("stimuli/stimuli.js") as f:
    updatedfile = "var stimuli = " + f.read()
with open("stimuli/stimuli.js", "w") as f:
    f.write(updatedfile)

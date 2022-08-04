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
n = 80

# Delete all existing stimuli
for f in glob.glob("stimuli/*"):
    os.remove(f)


def generate_images(data, strengths, differences, function, name="Delboeuf", **kwargs):

    for strength in strengths:
        for difference in differences:

            img = function(illusion_strength=strength, difference=difference, **kwargs).to_image(
                width=width, height=height, target_only=True
            )
            path = (
                name
                + "_str"
                + str(np.round(strength, 6))
                + "_diff"
                + str(np.round(difference, 6))
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

    return data


def save_json(data, name="stimuli"):
    file = "stimuli/" + name + ".js"
    # 1. Save data to a javascript file
    with open(file, "w") as fp:
        json.dump(data, fp)

    # 2. Re-read and add "var test_stimuli ="
    with open(file) as f:
        updatedfile = "var " + name + " = " + f.read()
    with open(file, "w") as f:
        f.write(updatedfile)


def sqrtspace(mini=0.1, maxi=1, size=6):
    x = np.linspace(np.sqrt(0), np.sqrt(1), int(size / 2) + 1, endpoint=True) ** 2
    x = nk.rescale(x[1::], [mini, maxi])
    return np.concatenate((-1 * x[::-1], x))


def doublelinspace(mini=0.1, maxi=1, size=6, exp=False):
    if exp is False:
        x = np.linspace(mini, maxi, int(size / 2), endpoint=True)
    else:
        x = nk.expspace(mini, maxi, int(size / 2), out=float, base=2)
    return np.concatenate((-1 * x[::-1], x))


# =============================================================================
# Make Stimuli
# =============================================================================
data = []

# Left-right ======================================================================================
# -------------------------- Delboeuf Illusion --------------------------
ill.Delboeuf(illusion_strength=-0.4, difference=1.20).to_image(
    width=800, height=600, target_only=True
).save("utils/stimuli_demo/Delboeuf_Demo.png")
# ill.Delboeuf(illusion_strength=0, difference=0.1).to_image()


data = generate_images(
    data,
    strengths=[0],
    differences=doublelinspace(mini=0.001, maxi=1, size=n),
    function=ill.Delboeuf,
    name="Delboeuf",
    distance=0.9,
)


# -------------------------- Rod Frame Illusion --------------------------
ill.RodFrame(illusion_strength=-5, difference=30).to_image(
    width=800, height=600, target_only=True
).save("utils/stimuli_demo/RodFrame_Demo.png")


data = generate_images(
    data,
    strengths=[0],
    differences=doublelinspace(mini=0.001, maxi=7, size=n),
    function=ill.RodFrame,
    name="RodFrame",
)


# -------------------------- Vertical Horizontal Illusion --------------------------
ill.VerticalHorizontal(illusion_strength=-45, difference=1).to_image(width=800, height=600).save(
    "utils/stimuli_demo/VerticalHorizontal_Demo.png"
)


data = generate_images(
    data,
    strengths=[0],
    differences=doublelinspace(mini=0.001, maxi=0.25, size=n),
    function=ill.VerticalHorizontal,
    name="VerticalHorizontal",
)


# -------------------------- Zollner Illusion --------------------------
ill.Zollner(illusion_strength=-40, difference=8).to_image(
    width=800, height=600, target_only=True
).save("utils/stimuli_demo/Zollner_Demo.png")


data = generate_images(
    data,
    strengths=[0],
    differences=doublelinspace(mini=0.001, maxi=8, size=n),
    function=ill.Zollner,
    name="Zollner",
)


# -------------------------- White Illusion --------------------------
ill.White(illusion_strength=5, difference=50).to_image(width=800, height=600).save(
    "utils/stimuli_demo/White_Demo.png"
)


data = generate_images(
    data,
    strengths=[0],
    differences=doublelinspace(mini=0.001, maxi=17, size=n),
    function=ill.White,
    name="White",
)


# Up-Down ======================================================================================
# -------------------------- MullerLyer Illusion --------------------------
ill.MullerLyer(illusion_strength=-10, difference=0.7).to_image(
    width=800, height=600, target_only=True
).save("utils/stimuli_demo/MullerLyer_Demo.png")


data = generate_images(
    data,
    strengths=[0],
    differences=doublelinspace(mini=0.001, maxi=0.46, size=n),
    function=ill.MullerLyer,
    name="MullerLyer",
)


# -------------------------- Poggendorff Illusion --------------------------
ill.Poggendorff(illusion_strength=-20, difference=0.4).to_image(
    width=800, height=600, target_only=True
).save("utils/stimuli_demo/Poggendorff_Demo.png")


data = generate_images(
    data,
    strengths=[0],
    differences=doublelinspace(mini=0.001, maxi=0.3, size=n),
    function=ill.Poggendorff,
    name="Poggendorff",
)


# -------------------------- Contrast Illusion --------------------------
ill.Contrast(illusion_strength=-5, difference=30).to_image(width=800, height=600).save(
    "utils/stimuli_demo/Contrast_Demo.png"
)


data = generate_images(
    data,
    strengths=[0],
    differences=doublelinspace(mini=0.001, maxi=20, size=n),
    function=ill.Contrast,
    name="Contrast",
)


# -------------------------- Save data --------------------------
save_json(data, name="stimuli")

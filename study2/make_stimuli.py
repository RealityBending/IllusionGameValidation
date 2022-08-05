# -*- coding: utf-8 -*-
import glob
import json
import os

import matplotlib.pyplot as plt
import neurokit2 as nk
import numpy as np
import pandas as pd
import pyllusion as ill

# Parameters
width = 800
height = 800
n = 16

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
                + str(np.round(strength, 4))
                + "_diff"
                + str(np.round(difference, 4))
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


def doublelinspace(mini=0.1, maxi=1, size=6, transformation="lin", show=True):
    lin = np.linspace(mini, maxi, int(size / 2), endpoint=True)
    exp = nk.expspace(mini, maxi, int(size / 2), out=float)
    sq = (np.linspace(mini ** (1 / 2), maxi ** (1 / 2), int(size / 2), endpoint=True)) ** 2
    cb = (np.linspace(mini ** (1 / 3), maxi ** (1 / 3), int(size / 2), endpoint=True)) ** 3

    if show is True:
        plt.plot(lin, [0] * len(lin), "o", label="linear")
        plt.plot(exp, [0.2] * len(lin), "o", label="exp")
        plt.plot(sq, [0.4] * len(lin), "o", label="square")
        plt.plot(cb, [0.6] * len(lin), "o", label="cube")
        plt.legend()

    if transformation == "lin":
        x = lin
    elif transformation == "exp":
        x = exp
    elif transformation == "square":
        x = sq
    elif transformation == "cube":
        x = cb

    return np.round(np.concatenate((-1 * x[::-1], x)), 5)


# =============================================================================
# Make Stimuli
# =============================================================================
data_training = []
data_block1 = []
data_block2 = []

# Left-right ======================================================================================
# -------------------------- Delboeuf Illusion --------------------------
ill.Delboeuf(illusion_strength=-1.8, difference=1.40).to_image(width=800, height=600).save(
    "utils/stimuli_demo/Delboeuf_Demo.png"
)
# ill.Delboeuf(illusion_strength=0, difference=0.1).to_image()

strengths = np.linspace(-2.17, 2.17, n - 1)
diffs = doublelinspace(mini=0.07, maxi=0.7, size=n, transformation="cube")
diff1 = np.concatenate((diffs[0 : n // 2 : 2], diffs[n // 2 + 1 :: 2]))
diff2 = np.concatenate((diffs[1 : n // 2 : 2], diffs[n // 2 :: 2]))

data_training = generate_images(
    data_training,
    # strengths=strengths[0 : : (n // 2) - 1],
    strengths=strengths[2 : -2 : (n // 2) - 3],
    differences=[-1, 1],
    function=ill.Delboeuf,
    name="Delboeuf",
    distance=0.9,  # Distance between circles
)

data_block1 = generate_images(
    data_block1,
    strengths=strengths[1:-1:2],
    differences=diff1,
    function=ill.Delboeuf,
    name="Delboeuf",
    distance=0.9,  # Distance between circles
)


data_block2 = generate_images(
    data_block2,
    strengths=strengths[0::2],
    differences=diff2,
    function=ill.Delboeuf,
    name="Delboeuf",
    distance=0.9,  # Distance between circles
)


# -------------------------- Ebbinghaus Illusion --------------------------
ill.Ebbinghaus(illusion_strength=-1.4, difference=1.4).to_image(width=800, height=600).save(
    "utils/stimuli_demo/Ebbinghaus_Demo.png"
)


strengths = np.linspace(-2.03, 2.03, n - 1)
diffs = doublelinspace(mini=0.07, maxi=0.7, size=n, transformation="cube")
diff1 = np.concatenate((diffs[0 : n // 2 : 2], diffs[n // 2 + 1 :: 2]))
diff2 = np.concatenate((diffs[1 : n // 2 : 2], diffs[n // 2 :: 2]))


data_training = generate_images(
    data_training,
    # strengths=strengths[0 : : (n // 2) - 1],
    strengths=strengths[2 : -2 : (n // 2) - 3],
    differences=[-0.8, 0.8],
    function=ill.Ebbinghaus,
    name="Ebbinghaus",
    distance=0.9,  # Distance between circles
)

data_block1 = generate_images(
    data_block1,
    strengths=strengths[1:-1:2],
    differences=diff1,
    function=ill.Ebbinghaus,
    name="Ebbinghaus",
    distance=0.9,  # Distance between circles
)

data_block2 = generate_images(
    data_block2,
    strengths=strengths[0::2],
    differences=diff2,
    function=ill.Ebbinghaus,
    name="Ebbinghaus",
    distance=0.9,  # Distance between circles
)

# -------------------------- Rod Frame Illusion --------------------------
ill.RodFrame(illusion_strength=-5, difference=30).to_image(width=800, height=600).save(
    "utils/stimuli_demo/RodFrame_Demo.png"
)


strengths = np.linspace(-14, 14, n - 1)
diffs = doublelinspace(mini=0.06, maxi=7.1, size=n, transformation="square")
diff1 = np.concatenate((diffs[0 : n // 2 : 2], diffs[n // 2 + 1 :: 2]))
diff2 = np.concatenate((diffs[1 : n // 2 : 2], diffs[n // 2 :: 2]))


data_training = generate_images(
    data_training,
    # strengths=strengths[0 : : (n // 2) - 1],
    strengths=strengths[2 : -2 : (n // 2) - 3],
    differences=[-12, 12],
    function=ill.RodFrame,
    name="RodFrame",
)

data_block1 = generate_images(
    data_block1,
    strengths=strengths[1:-1:2],
    differences=diff1,
    function=ill.RodFrame,
    name="RodFrame",
)

data_block2 = generate_images(
    data_block2,
    strengths=strengths[0::2],
    differences=diff2,
    function=ill.RodFrame,
    name="RodFrame",
)

# -------------------------- Vertical Horizontal Illusion --------------------------
ill.VerticalHorizontal(illusion_strength=-45, difference=1).to_image(width=800, height=600).save(
    "utils/stimuli_demo/VerticalHorizontal_Demo.png"
)

strengths = np.linspace(-66.5, 66.5, n - 1)
diffs = doublelinspace(mini=0.03, maxi=0.24, size=n, transformation="square")
diff1 = np.concatenate((diffs[0 : n // 2 : 2], diffs[n // 2 + 1 :: 2]))
diff2 = np.concatenate((diffs[1 : n // 2 : 2], diffs[n // 2 :: 2]))

data_training = generate_images(
    data_training,
    # strengths=strengths[0 : : (n // 2) - 1],
    strengths=strengths[2 : -2 : (n // 2) - 3],
    differences=[-0.4, 0.4],
    function=ill.VerticalHorizontal,
    name="VerticalHorizontal",
)

data_block1 = generate_images(
    data_block1,
    strengths=strengths[1:-1:2],
    differences=diff1,
    function=ill.VerticalHorizontal,
    name="VerticalHorizontal",
)

data_block2 = generate_images(
    data_block2,
    strengths=strengths[0::2],
    differences=diff2,
    function=ill.VerticalHorizontal,
    name="VerticalHorizontal",
)

# -------------------------- Zollner Illusion --------------------------
ill.Zollner(illusion_strength=-40, difference=8).to_image(width=800, height=600).save(
    "utils/stimuli_demo/Zollner_Demo.png"
)

strengths = np.linspace(-42, 42, n - 1)
diffs = doublelinspace(mini=0.15, maxi=5, size=n, transformation="cube")
diff1 = np.concatenate((diffs[0 : n // 2 : 2], diffs[n // 2 + 1 :: 2]))
diff2 = np.concatenate((diffs[1 : n // 2 : 2], diffs[n // 2 :: 2]))


data_training = generate_images(
    data_training,
    # strengths=strengths[0 : : (n // 2) - 1],
    strengths=strengths[2 : -2 : (n // 2) - 3],
    differences=[-6, 6],
    function=ill.Zollner,
    name="Zollner",
)

data_block1 = generate_images(
    data_block1,
    strengths=strengths[1:-1:2],
    differences=diff1,
    function=ill.Zollner,
    name="Zollner",
)

data_block2 = generate_images(
    data_block2,
    strengths=strengths[0::2],
    differences=diff2,
    function=ill.Zollner,
    name="Zollner",
)


# -------------------------- White Illusion --------------------------
ill.White(illusion_strength=5, difference=50).to_image(width=800, height=600).save(
    "utils/stimuli_demo/White_Demo.png"
)

strengths = np.linspace(-17.5, 17.5, n - 1)
diffs = doublelinspace(mini=3, maxi=17.5, size=n, transformation="square")
diff1 = np.concatenate((diffs[0 : n // 2 : 2], diffs[n // 2 + 1 :: 2]))
diff2 = np.concatenate((diffs[1 : n // 2 : 2], diffs[n // 2 :: 2]))


data_training = generate_images(
    data_training,
    # strengths=strengths[0 : : (n // 2) - 1],
    strengths=strengths[2 : -2 : (n // 2) - 3],
    differences=[-20, 20],
    function=ill.White,
    name="White",
)

data_block1 = generate_images(
    data_block1,
    strengths=strengths[1:-1:2],
    differences=diff1,
    function=ill.White,
    name="White",
)

data_block2 = generate_images(
    data_block2,
    strengths=strengths[0::2],
    differences=diff2,
    function=ill.White,
    name="White",
)


# Up-Down ======================================================================================
# -------------------------- MullerLyer Illusion --------------------------
ill.MullerLyer(illusion_strength=-10, difference=0.7).to_image(width=800, height=600).save(
    "utils/stimuli_demo/MullerLyer_Demo.png"
)

strengths = np.linspace(-49, 49, n - 1)
diffs = doublelinspace(mini=0.04, maxi=0.46, size=n, transformation="square")
diff1 = np.concatenate((diffs[0 : n // 2 : 2], diffs[n // 2 + 1 :: 2]))
diff2 = np.concatenate((diffs[1 : n // 2 : 2], diffs[n // 2 :: 2]))


data_training = generate_images(
    data_training,
    # strengths=strengths[0 : : (n // 2) - 1],
    strengths=strengths[2 : -2 : (n // 2) - 3],
    differences=[-0.6, 0.6],
    function=ill.MullerLyer,
    name="MullerLyer",
)

data_block1 = generate_images(
    data_block1,
    strengths=strengths[1:-1:2],
    differences=diff1,
    function=ill.MullerLyer,
    name="MullerLyer",
)

data_block2 = generate_images(
    data_block2,
    strengths=strengths[0::2],
    differences=diff2,
    function=ill.MullerLyer,
    name="MullerLyer",
)


# -------------------------- Ponzo Illusion --------------------------
ill.Ponzo(illusion_strength=5, difference=0.7).to_image(width=800, height=600).save(
    "utils/stimuli_demo/Ponzo_Demo.png"
)


strengths = np.linspace(-25.2, 25.2, n - 1)
diffs = doublelinspace(mini=0.04, maxi=0.46, size=n, transformation="square")
diff1 = np.concatenate((diffs[0 : n // 2 : 2], diffs[n // 2 + 1 :: 2]))
diff2 = np.concatenate((diffs[1 : n // 2 : 2], diffs[n // 2 :: 2]))


data_training = generate_images(
    data_training,
    # strengths=strengths[0 : : (n // 2) - 1],
    strengths=strengths[2 : -2 : (n // 2) - 3],
    differences=[-0.6, 0.6],
    function=ill.Ponzo,
    name="Ponzo",
)

data_block1 = generate_images(
    data_block1,
    strengths=strengths[1:-1:2],
    differences=diff1,
    function=ill.Ponzo,
    name="Ponzo",
)

data_block2 = generate_images(
    data_block2,
    strengths=strengths[0::2],
    differences=diff2,
    function=ill.Ponzo,
    name="Ponzo",
)


# -------------------------- Poggendorff Illusion --------------------------
ill.Poggendorff(illusion_strength=-20, difference=0.4).to_image(width=800, height=600).save(
    "utils/stimuli_demo/Poggendorff_Demo.png"
)


strengths = np.linspace(-44.8, 44.8, n - 1)
diffs = doublelinspace(mini=0.02, maxi=0.3, size=n, transformation="cube")
diff1 = np.concatenate((diffs[0 : n // 2 : 2], diffs[n // 2 + 1 :: 2]))
diff2 = np.concatenate((diffs[1 : n // 2 : 2], diffs[n // 2 :: 2]))


data_training = generate_images(
    data_training,
    # strengths=strengths[0 : : (n // 2) - 1],
    strengths=strengths[2 : -2 : (n // 2) - 3],
    differences=[-0.4, 0.4],
    function=ill.Poggendorff,
    name="Poggendorff",
)

data_block1 = generate_images(
    data_block1,
    strengths=strengths[1:-1:2],
    differences=diff1,
    function=ill.Poggendorff,
    name="Poggendorff",
)

data_block2 = generate_images(
    data_block2,
    strengths=strengths[0::2],
    differences=diff2,
    function=ill.Poggendorff,
    name="Poggendorff",
)


# -------------------------- Contrast Illusion --------------------------
ill.Contrast(illusion_strength=-5, difference=30).to_image(width=800, height=600).save(
    "utils/stimuli_demo/Contrast_Demo.png"
)


strengths = np.linspace(-31.5, 31.5, n - 1)
diffs = doublelinspace(mini=3, maxi=17.5, size=n, transformation="square")
diff1 = np.concatenate((diffs[0 : n // 2 : 2], diffs[n // 2 + 1 :: 2]))
diff2 = np.concatenate((diffs[1 : n // 2 : 2], diffs[n // 2 :: 2]))


data_training = generate_images(
    data_training,
    # strengths=strengths[0 : : (n // 2) - 1],
    strengths=strengths[2 : -2 : (n // 2) - 3],
    differences=[-25, 25],
    function=ill.Contrast,
    name="Contrast",
)

data_block1 = generate_images(
    data_block1,
    strengths=strengths[1:-1:2],
    differences=diff1,
    function=ill.Contrast,
    name="Contrast",
)

data_block2 = generate_images(
    data_block2,
    strengths=strengths[0::2],
    differences=diff2,
    function=ill.Contrast,
    name="Contrast",
)


# -------------------------- Save data --------------------------
save_json(data_training, name="stimuli_training")
save_json(data_block1, name="stimuli_part1")
save_json(data_block2, name="stimuli_part2")

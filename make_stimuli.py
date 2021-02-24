# -*- coding: utf-8 -*-
import pyllusion as ill
import numpy as np
import pandas as pd
from win32api import GetSystemMetrics


# Get screen resolution
# width = GetSystemMetrics(0)
# height = GetSystemMetrics(1) 
width = 1024
height = 576

# -------------------------- Circle Size Illusions --------------------------
### Delboeuf, Ebbinghaus

strengths = np.arange(-1, 2) # should contain 0; manipulate size of outer circles
differences = np.array([x for x in np.arange(-1, 2) if x != 0])  # manipulate size of left vs. right circles
mesh = np.array(np.meshgrid(strengths, differences))
combinations = mesh.T.reshape(-1, 2)

extract_illusions = []

for i in range(len(combinations)):

    # Generate parameters
    strength = combinations[i][0]
    difference = combinations[i][1]

    # Delbeouf Illusion
    delb_parameters = ill.delboeuf_parameters(illusion_strength=strength, difference=difference)
    delb_image = ill.delboeuf_image(delb_parameters, width=width, height=height)

    # Save image of Delboeuf Illusion
    delb_image_name = "delboeuf_" + "str" + str(strength) + "_diff" + str(difference) + ".png"
    delb_image.save("stimuli/" + delb_image_name)  # Save Image

    # Save parameters for Delbeouf Illusion
    extract_illusions.append({'Illusion_Type': 'Delboeuf',
                              'Illusion_Strength': strength,
                              'Difference': difference,
                              'File': 'stimuli/' + delb_image_name})
                    
    # Ebbinghaus Illusion
    ebb_parameters = ill.ebbinghaus_parameters(illusion_strength=strength, difference=difference)
    ebb_image = ill.ebbinghaus_image(ebb_parameters, width=width, height=height)

    # Ebbinghaus Illusion
    ebb_image_name = "ebbinghaus_" + "str" + str(strength) + "_diff" + str(difference) + ".png"
    ebb_image.save("Stimuli/" + ebb_image_name)  # Save Image

    # Save parameters for Ebbinghaus Illusion
    extract_illusions.append({'Illusion_Type': 'Ebbinghaus',
                              'Illusion_Strength':strength,
                              'Difference':difference,
                              'File': "stimuli/" + ebb_image_name})


# -------------------------- Line Length Illusions --------------------------
### Ponzo, MullerLyer, Vertical Horizontal

strengths = np.arange(-20, 40, step=20) # should contain 0; manipulate angles of distractor features
strengths_2 = np.arange(-80, 160, step=80)  # manipulate angles of compared lines (for Vertical Horizontal)
differences = np.array([x for x in np.arange(-0.5, 1, step=0.5) if x != 0])  # manipulate compared line lengths

mesh = np.array(np.meshgrid(strengths, differences))
mesh_2 = np.array(np.meshgrid(strengths_2, differences))
combinations = mesh.T.reshape(-1, 2)
combinations_2 = mesh_2.T.reshape(-1, 2)


for i in range(len(combinations)):

    # Generate parameters
    strength = combinations[i][0]
    difference = combinations[i][1]

    # Ponzo Illusion
    ponzo_parameters = ill.ponzo_parameters(illusion_strength=strength, difference=difference, size_min=0.4)
    ponzo_image = ill.ponzo_image(ponzo_parameters, width=width, height=height)

    # Save image of Ponzo Illusion
    ponzo_image_name = "ponzo_" + "str" + str(strength) + "_diff" + str(difference) + ".png"
    ponzo_image.save("stimuli/" + ponzo_image_name)  # Save Image

    # Save parameters for Ponzo Illusion
    extract_illusions.append({'Illusion_Type': 'Ponzo',
                              'Illusion_Strength':strength,
                              'Difference':difference,
                              'File':  "stimuli/" + ponzo_image_name})


    # MullerLyer Illusion
    mullerlyer_parameters = ill.mullerlyer_parameters(illusion_strength=strength, difference=difference)
    mullerlyer_image = ill.mullerlyer_image(mullerlyer_parameters, width=width, height=height)

    # Save image of MullerLyer Illusion
    mullerlyer_image_name = "mullerlyer_" + "str" + str(strength) + "_diff" + str(difference) + ".png"
    mullerlyer_image.save("stimuli/" + mullerlyer_image_name)  # Save Image

    # Save parameters for MullerLyer Illusion
    extract_illusions.append({'Illusion_Type': 'MullerLyer',
                              'Illusion_Strength':strength,
                              'Difference':difference,
                              'File':  "stimuli/" + mullerlyer_image_name})

    # Generate parameters
    strength_2 = combinations_2[i][0]

    # Vertical Horizontal Illusion
    vert_parameters = ill.verticalhorizontal_parameters(illusion_strength=strength_2, difference=difference)
    vert_image = ill.verticalhorizontal_image(vert_parameters, width=width, height=height)

    # Save image of Vertical Horizontal Illusion
    vert_image_name = "verticalhorizontal_" + "str" + str(strength_2) + "_diff" + str(difference) + ".png"
    vert_image.save("stimuli/" + vert_image_name)  # Save Image

    # Save parameters for Vertical Horizontal Illusion
    extract_illusions.append({'Illusion_Type': 'VerticalHorizontal',
                              'Illusion_Strength':strength_2,
                              'Difference':difference,
                              'File':  "stimuli/" + vert_image_name})


# -------------------------- Slanting Illusions --------------------------

### Zollner and RodFrame
strengths = np.arange(-80, 160, step=80) # should contain 0; manipulate tilting of distractor
differences = np.array([x for x in np.arange(-10, 20, step=20) if x != 0]) # manipulate tilting of target
mesh = np.array(np.meshgrid(strengths, differences))
combinations = mesh.T.reshape(-1, 2)

### Poggendorff
strengths_2 = np.arange(-60, 120, step=60) # manipulate tilting of target lines
differences_2 = np.array([x for x in np.arange(-0.3, 0.6, step=0.3) if x != 0]) # manipulate displacement of two lines
mesh_2 = np.array(np.meshgrid(strengths_2, differences_2))
combinations_2 = mesh_2.T.reshape(-1, 2)


for i in range(len(combinations)):

    # Generate parameters
    strength = combinations[i][0]
    difference = combinations[i][1]

    # Zollner Illusion
    zollner_parameters = ill.zollner_parameters(illusion_strength=strength, difference=difference)
    zollner_image = ill.zollner_image(zollner_parameters, width=width, height=height)

    # Save image of Zollner Illusion
    zollner_image_name = "zollner_" + "str" + str(strength) + "_diff" + str(difference) + ".png"
    zollner_image.save("stimuli/" + zollner_image_name)  # Save Image

    # Save parameters for Zollner Illusion
    extract_illusions.append({'Illusion_Type': 'Zollner',
                              'Illusion_Strength':strength,
                              'Difference':difference,
                              'File':  "stimuli/" + zollner_image_name})


    # RodFrame Illusion
    rodframe_parameters = ill.rodframe_parameters(illusion_strength=strength, difference=difference)
    rodframe_image = ill.rodframe_image(rodframe_parameters, width=width, height=height)

    # Save image of RodFrame Illusion
    rodframe_image_name = "rodframe_" + "str" + str(strength) + "_diff" + str(difference) + ".png"
    rodframe_image.save("stimuli/" + rodframe_image_name)  # Save Image

    # Save parameters for RodFrame Illusion
    extract_illusions.append({'Illusion_Type': 'RodFrame',
                              'Illusion_Strength':strength,
                              'Difference':difference,
                              'File':  "stimuli/" + rodframe_image_name})

    # Generate parameters
    strength_2 = combinations_2[i][0]
    difference_2 = combinations_2[i][1]

    # Poggendorff Illusion
    pog_parameters = ill.poggendorff_parameters(illusion_strength=strength_2, difference=difference_2)
    pog_image = ill.poggendorff_image(pog_parameters, width=width, height=height)

    # Save image of Poggendorff Illusion
    pog_image_name = "poggendorff_" + "str" + str(strength_2) + "_diff" + str(difference_2) + ".png"
    pog_image.save("stimuli/" + pog_image_name)  # Save Image

    # Save parameters for Poggendorff Illusion
    extract_illusions.append({'Illusion_Type': 'Poggendorff',
                              'Illusion_Strength':strength_2,
                              'Difference':difference_2,
                              'File':  "stimuli/" + pog_image_name})


# -------------------------- Colour Contrast Illusions --------------------------

### Simultaneous Contrast
strengths = np.arange(-50, 100, step=50) # should contain 0; manipulate contrasting background colour
differences = np.array([x for x in np.arange(-20, 40, step=20) if x != 0]) #  manipulate contrasting target colour
mesh = np.array(np.meshgrid(strengths, differences))
combinations = mesh.T.reshape(-1, 2)


for i in range(len(combinations)):

    # Generate parameters
    strength = combinations[i][0]
    difference = combinations[i][1]

    # Contrast Illusion
    contrast_parameters = ill.contrast_parameters(illusion_strength=strength, difference=difference)
    contrast_image = ill.contrast_image(contrast_parameters, width=width, height=height)

    # Save image of Zollner Illusion
    contrast_image_name = "contrast_" + "str" + str(strength) + "_diff" + str(difference) + ".png"
    contrast_image.save("stimuli/" + contrast_image_name)  # Save Image

    # Save parameters for Zollner Illusion
    extract_illusions.append({'Illusion_Type': 'SimultaneousContrast',
                              'Illusion_Strength':strength,
                              'Difference':difference,
                              'File':  "stimuli/" + contrast_image_name})
    
    

# Save csv of illusions
extract_illusions = pd.DataFrame(extract_illusions)
extract_illusions = extract_illusions.sort_values('Illusion_Type')
extract_illusions.to_csv('stimuli.csv', index=False)


# -------------------------- Demo Illusions --------------------------

# Delbeouf
delboeuf_parameters = ill.delboeuf_parameters(illusion_strength=0, difference=5)
image = ill.delboeuf_image(delboeuf_parameters, width=width, height=height)
image.save("Demo_Stimuli/" + "Delboeuf_Demo.png")

# Ebbinghaus
ebbinghaus_parameters = ill.ebbinghaus_parameters(illusion_strength=0, difference=5)
image2 = ill.ebbinghaus_image(ebbinghaus_parameters, width=width, height=height)
image2.save("demo_stimuli/" + "Ebbinghaus_Demo.png")

# Muller Lyer
mullerlyer_parameters = ill.mullerlyer_parameters(illusion_strength=0, difference=0.5)
image3 = ill.mullerlyer_image(mullerlyer_parameters, width=width, height=height)
image3.save("demo_stimuli/" + "MullerLyer_Demo.png")

# Poggendorff
poggendorff_parameters = ill.poggendorff_parameters(illusion_strength=0, difference=0.3)
image4 = ill.poggendorff_image(poggendorff_parameters, width=width, height=height)
image4.save("demo_stimuli/" + "Poggendorff_Demo.png")

# Ponzo
ponzo_parameters = ill.ponzo_parameters(illusion_strength=0, difference=0.5)
image5 = ill.ponzo_image(ponzo_parameters, width=width, height=height)
image5.save("demo_stimuli/" + "Ponzo_Demo.png")

# Rod and Frame
rodframe_parameters = ill.rodframe_parameters(illusion_strength=0, difference=30)
image6 = ill.rodframe_image(rodframe_parameters, width=width, height=height)
image6.save("demo_stimuli/" + "RodFrame_Demo.png")

# Vertical Horizontal
verticalhorizontal_parameters = ill.verticalhorizontal_parameters(illusion_strength=0, difference=0.5)
image7 = ill.verticalhorizontal_image(verticalhorizontal_parameters, width=width, height=height)
image7.save("demo_stimuli/" + "VerticalHorizontal_Demo.png")

# Zollner
zollner_parameters = ill.zollner_parameters(illusion_strength=0, difference=15)
image8 = ill.zollner_image(zollner_parameters, width=width, height=height)
image8.save("demo_stimuli/" + "Zollner_Demo.png")

# Contrast
contrast_parameters = ill.contrast_parameters(illusion_strength=0, difference=30)
image9 = ill.contrast_image(contrast_parameters, width=width, height=height)
image9.save("demo_stimuli/" + "Contrast_Demo.png")

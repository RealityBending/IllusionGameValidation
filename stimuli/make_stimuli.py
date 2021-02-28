# -*- coding: utf-8 -*-
import numpy as np
import pandas as pd
import pyllusion as ill

# Parameters
width = 800
height = 800
n = 4
data = []


# Convenience functions
def save_mosaic(strengths, differences, function, name = "Delboeuf"):
    imgs = []
    for strength in [min(strengths, key=abs), max(strengths)]:
        for difference in [min(differences, key=abs), max(differences)]:
            img = function(illusion_strength=strength, difference=difference, width=width, height=height)
            img = ill.image_text("Difference: " + str(np.round(difference, 2)) + ", Strength: " + str(np.round(strength, 2)), y=0.88, size=40, image=img)
            imgs.append(img)
    img = ill.image_mosaic(imgs, ncols=2)
    img = ill.image_line(length=2, rotate=0, image = img)
    img = ill.image_line(length=2, rotate=90, image = img)
    img.save("../utils/" + name + "_Mosaic.png")


def generate_images(data, strengths, differences, function, name = "Delboeuf"):
    for strength in strengths:
        for difference in differences:

            img = function(illusion_strength=strength, difference=difference, width=width, height=height)
            path = name + "_str" + str(np.round(strength, 2)) + "_diff" + str(np.round(difference, 2)) + ".png"
            img.save(path)

            # Save parameters for Delboeuf Illusion
            data.append({'Illusion_Type': name,
                         'Illusion_Strength': strength,
                         'Difference': difference,
                         'File': path})
    save_mosaic(strengths, differences, function, name = name)
    return data







# -------------------------- Demo Illusions for Instructions --------------------------

ill.delboeuf_image(illusion_strength=0, difference=5, width=width, height=height).save("../utils/" + "Delboeuf_Demo.png")
ill.ebbinghaus_image(illusion_strength=0, difference=5, width=width, height=height).save("../utils/" + "Ebbinghaus_Demo.png")
ill.mullerlyer_image(illusion_strength=0, difference=0.5, width=width, height=height).save("../utils/" + "MullerLyer_Demo.png")
ill.poggendorff_image(illusion_strength=0, difference=0.3, width=width, height=height).save("../utils/" + "Poggendorff_Demo.png")
ill.ponzo_image(illusion_strength=0, difference=0.5, width=width, height=height).save("../utils/" + "Ponzo_Demo.png")
ill.rodframe_image(illusion_strength=0, difference=30, width=width, height=height).save("../utils/" + "RodFrame_Demo.png")
ill.verticalhorizontal_image(illusion_strength=0, difference=0.5, width=width, height=height).save("../utils/" + "VerticalHorizontal_Demo.png")
ill.zollner_image(illusion_strength=0, difference=15, width=width, height=height).save("../utils/" + "Zollner_Demo.png")
ill.contrast_image(illusion_strength=0, difference=30, width=width, height=height).save("../utils/" + "Contrast_Demo.png")



# -------------------------- Delboeuf Illusion --------------------------
data = generate_images(data,
                       strengths = np.linspace(-1, 1, num = n),
                       differences = np.linspace(-1, 1, num = n),
                       function = ill.delboeuf_image,
                       name = "Delboeuf")

# -------------------------- Ebbinghaus Illusion --------------------------
data = generate_images(data,
                       strengths = np.linspace(-1, 1, num = n),
                       differences = np.linspace(-1, 1, num = n),
                       function = ill.ebbinghaus_image,
                       name = "Ebbinghaus")


# -------------------------- Save data --------------------------
df = pd.DataFrame(data).sort_values('Illusion_Type')
df.to_csv('stimuli.csv', index=False)





# # -------------------------- Line Length Illusions --------------------------
# ### Ponzo, MullerLyer, Vertical Horizontal

# strengths = np.arange(-20, 40, step=20) # should contain 0; manipulate angles of distractor features
# strengths_2 = np.arange(-80, 160, step=80)  # manipulate angles of compared lines (for Vertical Horizontal)
# differences = np.array([x for x in np.arange(-0.5, 1, step=0.5) if x != 0])  # manipulate compared line lengths

# mesh = np.array(np.meshgrid(strengths, differences))
# mesh_2 = np.array(np.meshgrid(strengths_2, differences))
# combinations = mesh.T.reshape(-1, 2)
# combinations_2 = mesh_2.T.reshape(-1, 2)


# for i in range(len(combinations)):

#     # Generate parameters
#     strength = combinations[i][0]
#     difference = combinations[i][1]

#     # Ponzo Illusion
#     ponzo_parameters = ill.ponzo_parameters(illusion_strength=strength, difference=difference, size_min=0.4)
#     ponzo_image = ill.ponzo_image(ponzo_parameters, width=width, height=height)

#     # Save image of Ponzo Illusion
#     ponzo_image_name = "ponzo_" + "str" + str(strength) + "_diff" + str(difference) + ".png"
#     ponzo_image.save("stimuli/" + ponzo_image_name)  # Save Image

#     # Save parameters for Ponzo Illusion
#     extract_illusions.append({'Illusion_Type': 'Ponzo',
#                               'Illusion_Strength':strength,
#                               'Difference':difference,
#                               'File':  "stimuli/" + ponzo_image_name})


#     # MullerLyer Illusion
#     mullerlyer_parameters = ill.mullerlyer_parameters(illusion_strength=strength, difference=difference)
#     mullerlyer_image = ill.mullerlyer_image(mullerlyer_parameters, width=width, height=height)

#     # Save image of MullerLyer Illusion
#     mullerlyer_image_name = "mullerlyer_" + "str" + str(strength) + "_diff" + str(difference) + ".png"
#     mullerlyer_image.save("stimuli/" + mullerlyer_image_name)  # Save Image

#     # Save parameters for MullerLyer Illusion
#     extract_illusions.append({'Illusion_Type': 'MullerLyer',
#                               'Illusion_Strength':strength,
#                               'Difference':difference,
#                               'File':  "stimuli/" + mullerlyer_image_name})

#     # Generate parameters
#     strength_2 = combinations_2[i][0]

#     # Vertical Horizontal Illusion
#     vert_parameters = ill.verticalhorizontal_parameters(illusion_strength=strength_2, difference=difference)
#     vert_image = ill.verticalhorizontal_image(vert_parameters, width=width, height=height)

#     # Save image of Vertical Horizontal Illusion
#     vert_image_name = "verticalhorizontal_" + "str" + str(strength_2) + "_diff" + str(difference) + ".png"
#     vert_image.save("stimuli/" + vert_image_name)  # Save Image

#     # Save parameters for Vertical Horizontal Illusion
#     extract_illusions.append({'Illusion_Type': 'VerticalHorizontal',
#                               'Illusion_Strength':strength_2,
#                               'Difference':difference,
#                               'File':  "stimuli/" + vert_image_name})


# # -------------------------- Slanting Illusions --------------------------

# ### Zollner and RodFrame
# strengths = np.arange(-80, 160, step=80) # should contain 0; manipulate tilting of distractor
# differences = np.array([x for x in np.arange(-10, 20, step=20) if x != 0]) # manipulate tilting of target
# mesh = np.array(np.meshgrid(strengths, differences))
# combinations = mesh.T.reshape(-1, 2)

# ### Poggendorff
# strengths_2 = np.arange(-60, 120, step=60) # manipulate tilting of target lines
# differences_2 = np.array([x for x in np.arange(-0.3, 0.6, step=0.3) if x != 0]) # manipulate displacement of two lines
# mesh_2 = np.array(np.meshgrid(strengths_2, differences_2))
# combinations_2 = mesh_2.T.reshape(-1, 2)


# for i in range(len(combinations)):

#     # Generate parameters
#     strength = combinations[i][0]
#     difference = combinations[i][1]

#     # Zollner Illusion
#     zollner_parameters = ill.zollner_parameters(illusion_strength=strength, difference=difference)
#     zollner_image = ill.zollner_image(zollner_parameters, width=width, height=height)

#     # Save image of Zollner Illusion
#     zollner_image_name = "zollner_" + "str" + str(strength) + "_diff" + str(difference) + ".png"
#     zollner_image.save("stimuli/" + zollner_image_name)  # Save Image

#     # Save parameters for Zollner Illusion
#     extract_illusions.append({'Illusion_Type': 'Zollner',
#                               'Illusion_Strength':strength,
#                               'Difference':difference,
#                               'File':  "stimuli/" + zollner_image_name})


#     # RodFrame Illusion
#     rodframe_parameters = ill.rodframe_parameters(illusion_strength=strength, difference=difference)
#     rodframe_image = ill.rodframe_image(rodframe_parameters, width=width, height=height)

#     # Save image of RodFrame Illusion
#     rodframe_image_name = "rodframe_" + "str" + str(strength) + "_diff" + str(difference) + ".png"
#     rodframe_image.save("stimuli/" + rodframe_image_name)  # Save Image

#     # Save parameters for RodFrame Illusion
#     extract_illusions.append({'Illusion_Type': 'RodFrame',
#                               'Illusion_Strength':strength,
#                               'Difference':difference,
#                               'File':  "stimuli/" + rodframe_image_name})

#     # Generate parameters
#     strength_2 = combinations_2[i][0]
#     difference_2 = combinations_2[i][1]

#     # Poggendorff Illusion
#     pog_parameters = ill.poggendorff_parameters(illusion_strength=strength_2, difference=difference_2)
#     pog_image = ill.poggendorff_image(pog_parameters, width=width, height=height)

#     # Save image of Poggendorff Illusion
#     pog_image_name = "poggendorff_" + "str" + str(strength_2) + "_diff" + str(difference_2) + ".png"
#     pog_image.save("stimuli/" + pog_image_name)  # Save Image

#     # Save parameters for Poggendorff Illusion
#     extract_illusions.append({'Illusion_Type': 'Poggendorff',
#                               'Illusion_Strength':strength_2,
#                               'Difference':difference_2,
#                               'File':  "stimuli/" + pog_image_name})


# # -------------------------- Colour Contrast Illusions --------------------------

# ### Simultaneous Contrast
# strengths = np.arange(-50, 100, step=50) # should contain 0; manipulate contrasting background colour
# differences = np.array([x for x in np.arange(-20, 40, step=20) if x != 0]) #  manipulate contrasting target colour
# mesh = np.array(np.meshgrid(strengths, differences))
# combinations = mesh.T.reshape(-1, 2)


# for i in range(len(combinations)):

#     # Generate parameters
#     strength = combinations[i][0]
#     difference = combinations[i][1]

#     # Contrast Illusion
#     contrast_parameters = ill.contrast_parameters(illusion_strength=strength, difference=difference)
#     contrast_image = ill.contrast_image(contrast_parameters, width=width, height=height)

#     # Save image of Zollner Illusion
#     contrast_image_name = "contrast_" + "str" + str(strength) + "_diff" + str(difference) + ".png"
#     contrast_image.save("stimuli/" + contrast_image_name)  # Save Image

#     # Save parameters for Zollner Illusion
#     extract_illusions.append({'Illusion_Type': 'SimultaneousContrast',
#                               'Illusion_Strength':strength,
#                               'Difference':difference,
#                               'File':  "stimuli/" + contrast_image_name})





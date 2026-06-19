# import os
# import shutil
#
# images_path = r"D:\carsSorted\simple3\train\images"
# labels_path = r"D:\carsSorted\simple3\train\labels"
#
# output_base = r"D:\carsSorted\sortedImages3"
#
# classes = {
#     "0": "honda",
#     "1": "suzuki",
#     "2": "toyota"
# }
#
# # create destination folders
# for name in classes.values():
#     os.makedirs(os.path.join(output_base, name), exist_ok=True)
#
# for label_file in os.listdir(labels_path):
#
#     if not label_file.endswith(".txt"):
#         continue
#
#     label_path = os.path.join(labels_path, label_file)
#
#     with open(label_path, "r") as f:
#         line = f.readline().strip()
#         if line == "":
#             continue
#
#         class_id = line.split()[0]
#
#     image_name = label_file.replace(".txt", ".jpg")
#     image_path = os.path.join(images_path, image_name)
#
#     if os.path.exists(image_path) and class_id in classes:
#         dest_folder = os.path.join(output_base, classes[class_id])
#         shutil.copy(image_path, os.path.join(dest_folder, image_name))
#
# print("Images sorted by class successfully.")



import os
import random
import shutil

# TRAIN PATHS
train_images_path = r"D:\companyType\train\images"
train_labels_path = r"D:\companyType\train\labels"

# VALID PATHS (D drive pe banenge)
valid_images_path = r"D:\companyType\valid\images"
valid_labels_path = r"D:\companyType\valid\labels"

# create folders automatically
os.makedirs(valid_images_path, exist_ok=True)
os.makedirs(valid_labels_path, exist_ok=True)

# get all images
images = os.listdir(train_images_path)

# shuffle
random.shuffle(images)

# 20% split
split_size = int(0.2 * len(images))
valid_images = images[:split_size]

for img in valid_images:
    label = os.path.splitext(img)[0] + ".txt"

    img_path = os.path.join(train_images_path, img)
    label_path = os.path.join(train_labels_path, label)

    # move image
    if os.path.exists(img_path):
        shutil.move(img_path, os.path.join(valid_images_path, img))

    # move label
    if os.path.exists(label_path):
        shutil.move(label_path, os.path.join(valid_labels_path, label))

print("✅ Validation set created in D drive successfully!")
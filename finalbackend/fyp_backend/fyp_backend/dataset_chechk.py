# import os
# import random
#
# # Paths
# image_folder = r"D:\third_yolov11\train\images"
# label_folder = r"D:\third_yolov11\train\labels"
#
# # Get list of all label files
# label_files = [f for f in os.listdir(label_folder) if f.endswith(".txt")]
#
# # Filter label files that contain front (class 0)
# front_files = []
# for file in label_files:
#     with open(os.path.join(label_folder, file), "r") as f:
#         classes_in_file = set([int(line.split()[0]) for line in f.readlines()])
#         if 0 in classes_in_file:
#             front_files.append(file)
#
# # Number of front images to remove
# target_front_count = 1550
# current_front_count = len(front_files)
# remove_count = current_front_count - target_front_count
#
# if remove_count <= 0:
#     print("Front images are already <= 1500. No action needed.")
# else:
#     print(f"Removing {remove_count} front images...")
#
#     # Randomly select files to remove
#     remove_files = random.sample(front_files, remove_count)
#
#     for file in remove_files:
#         # Remove image
#         image_name_jpg = file.replace(".txt", ".jpg")  # adjust if your images are .png
#         image_path = os.path.join(image_folder, image_name_jpg)
#         if os.path.exists(image_path):
#             os.remove(image_path)
#
#         # Remove label
#         label_path = os.path.join(label_folder, file)
#         os.remove(label_path)
#
#     print("Balancing completed!")
#     print(f"Front images now: {target_front_count}")



import os

# Path to your label folder
label_folder =r"D:\All Models\AliyanMODel\train\labels" # Change if needed

# Class names
classes =  ['alto2', 'alto8', 'cultus2', 'cultus3']

# Counters
image_counts = {cls: 0 for cls in classes}   # Images containing each class
object_counts = {cls: 0 for cls in classes}  # Total objects per class

# Iterate through all label files
for label_file in os.listdir(label_folder):
    if label_file.endswith(".txt"):
        file_path = os.path.join(label_folder, label_file)
        with open(file_path, "r") as f:
            lines = f.readlines()
            # Get unique classes in this image
            unique_classes = set([int(line.split()[0]) for line in lines])
            for cls_id in unique_classes:
                image_counts[classes[cls_id]] += 1
            # Count total objects
            for line in lines:
                cls_id = int(line.split()[0])
                object_counts[classes[cls_id]] += 1

# Print results
print("=== Number of images containing each class ===")
for cls, count in image_counts.items():
    print(f"{cls}: {count}")

print("\n=== Total number of objects per class ===")
for cls, count in object_counts.items():
    print(f"{cls}: {count}")



# import os
# import random
#
# # Paths (your paths)
# image_folder = r"D:\companyType\train\images"
# label_folder = r"D:\companyType\train\labels"
#
# # Targets
# targets = {
#     1: 1100,  # suzuki
#     2: 1000  # toyota
# }
#
# # Step 1: collect files per class
# class_files = {1: [], 2: []}
#
# label_files = [f for f in os.listdir(label_folder) if f.endswith(".txt")]
#
# for file in label_files:
#     with open(os.path.join(label_folder, file), "r") as f:
#         classes = set([int(line.split()[0]) for line in f.readlines()])
#
#         for c in [1, 2]:
#             if c in classes:
#                 class_files[c].append(file)
#
# # Step 2: delete extra files
# for cls_id in [1, 2]:
#     current_count = len(class_files[cls_id])
#     target_count = targets[cls_id]
#
#     remove_count = current_count - target_count
#
#     if remove_count <= 0:
#         print(f"Class {cls_id} already within limit")
#         continue
#
#     print(f"Deleting {remove_count} images for class {cls_id}...")
#
#     remove_files = random.sample(class_files[cls_id], remove_count)
#
#     for file in remove_files:
#         img_name = file.replace(".txt", ".jpg")  # change if png
#
#         img_path = os.path.join(image_folder, img_name)
#         label_path = os.path.join(label_folder, file)
#
#         # delete image
#         if os.path.exists(img_path):
#             os.remove(img_path)
#
#         # delete label
#         if os.path.exists(label_path):
#             os.remove(label_path)
#
# print("🔥 Permanent deletion completed!")




# import os
# import random
#
# # -------- PATHS --------
# labels_path = r"D:\All Models\AliyanMODel\train\labels"
# images_path = r"D:\All Models\AliyanMODel\train\images"
# # ----------------------
#
# # Classes
# classes = ['alto2', 'alto8', 'cultus2', 'cultus3']
#
# # Target limits
# limits = {
#     1: 1000,  # alto8
#     2: 1000   # cultus2
# }
#
# # Step 1: Collect all target objects
# all_objects = {cls_id: [] for cls_id in limits}
#
# for file in os.listdir(labels_path):
#     if file.endswith(".txt"):
#         path = os.path.join(labels_path, file)
#
#         with open(path, "r") as f:
#             lines = f.readlines()
#
#         for idx, line in enumerate(lines):
#             cls_id = int(line.split()[0])
#             if cls_id in limits:
#                 all_objects[cls_id].append((path, idx))
#
# # Step 2: Randomly select objects to KEEP
# keep_map = {}
#
# for cls_id, items in all_objects.items():
#     random.shuffle(items)
#     keep_items = items[:limits[cls_id]]
#
#     for path, idx in keep_items:
#         if path not in keep_map:
#             keep_map[path] = set()
#         keep_map[path].add(idx)
#
# # Step 3: Rewrite labels + delete empty images
# for file in os.listdir(labels_path):
#     if file.endswith(".txt"):
#         label_file = os.path.join(labels_path, file)
#
#         with open(label_file, "r") as f:
#             lines = f.readlines()
#
#         new_lines = []
#         for idx, line in enumerate(lines):
#             cls_id = int(line.split()[0])
#
#             if cls_id not in limits:
#                 new_lines.append(line)
#             else:
#                 if label_file in keep_map and idx in keep_map[label_file]:
#                     new_lines.append(line)
#
#         # If label becomes empty → delete label + image
#         if len(new_lines) == 0:
#             os.remove(label_file)
#
#             # delete corresponding image
#             img_name = file.replace(".txt", ".jpg")  # change if png
#             img_path = os.path.join(images_path, img_name)
#
#             if os.path.exists(img_path):
#                 os.remove(img_path)
#
#         else:
#             # overwrite label
#             with open(label_file, "w") as f:
#                 f.writelines(new_lines)
#
# print("✅ Done! Dataset cleaned (extra objects removed + empty images deleted)")
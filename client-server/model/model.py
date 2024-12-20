import cv2
import matplotlib.pyplot as plt
from ultralytics import YOLO
import os
import time
import threading

# Function to list active threads
def list_threads():
    print(f"Active threads: {threading.enumerate()}")

# Call the function to list active threads
list_threads()

def detect_objects_image(imagepath:str):
    model_path = 'best.pt'
    
    if not os.path.exists(model_path):
        print(f"Error: Model file '{model_path}' not found.")
        return None
    
    model = YOLO(model_path)

    image_path = imagepath

    image = cv2.imread(image_path)

    if image is None:
        print('Error: Could not load image at', image_path)
        exit()
    start_time = time.time()
    results = model(image_path)
    end_time = time.time()

    # Calculate the elapsed time
    elapsed_time = end_time - start_time
    print(f"Execution time: {elapsed_time:.4f} seconds")

    for result in results:
        boxes = result.boxes.xyxy
        scores = result.boxes.conf
        class_ids = result.boxes.cls
        for box, score, class_id in zip(boxes, scores, class_ids):
            xmin, ymin, xmax, ymax = map(int, box)
            label = model.names[int(class_id)]  # Get the label of the class
            print(f'Detected: {label} with confidence: {score:.2f}')
            cv2.rectangle(image, (xmin, ymin), (xmax, ymax), (0, 255, 0), 2)
            cv2.putText(image, f'{label} {score:.2f}', (xmin, ymin - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.9, (36, 255, 12), 2)

    # return image
    print('done')
    # resize_image = cv2.resize(image, (500, 500))

    # resize_image_rgb = cv2.cvtColor(resize_image, cv2.COLOR_BGR2RGB)

    # plt.imshow(resize_image_rgb)
    # plt.axis('on')
    # plt.show()

    # cv2.waitKey(0)
    # cv2.destroyAllWindows()

detect_objects_image('glass.jpg')
import socketio
import time
import random
import json
import os
import asyncio
import numpy as np
import base64
import sys
import cv2
from ultralytics import YOLO
# from model.model import detect_objects_image
# sys.path.append('./model')
# from model.model import detect_objects_image

sio = socketio.Client()

model = YOLO('best.pt')

connections = []

file_data = b''

async def process_image(image_data: bytes):
    # Load image from bytes in memory
    nparr = np.frombuffer(image_data, np.uint8)
    image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    # image_resized = cv2.resize(image, (640, 640), interpolation=cv2.INTER_LINEAR)

    if image is None:
        print("Error: Could not decode image.")
        return None
    
    start_time = time.time()
    results = model(image)
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
            # cv2.putText(image, f'{label} {score:.2f}', (xmin, ymin - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.9, (36, 255, 12), 2)

    _, buffer = cv2.imencode('.png', image)
    processed_image_data = buffer.tobytes()
    return processed_image_data


try:
    @sio.event
    def connect():
        print('Connected to server:', sio.sid)
        # connections.append(sio.sid)
        user_info = {
            'username': 'R-Pi'
        }
        sio.emit('user_info', user_info)
        print(connections)

    @sio.event
    def server_info(data):
        server_info = json.loads(data)
        maindata = {
            'servername': server_info['servername'],
            'socketid': sio.sid
        }
        connections.append(maindata)
        print(connections)

    @sio.event
    def message(data):
        print('Message from server:', data)

    @sio.event
    def reply(data):
        print('reply from server:', data)

    @sio.event
    def imageReceive(data):
        print(len(data['image']['image']))
        print('image is received')
        global file_data
        
        try:
            filename = 'received_image.png'

            # with open(filename, 'wb') as f:
            #     f.write(data['image']['image'])

            print(f"Image saved as {filename}")
            process = asyncio.run(process_image(data['image']['image']))

            # with open(filename, 'rb') as f:
            #     saved_image_data = f.read()
            
            sio.emit('imageResponse', {"response": process, 'userSocketId': data['image']['socketid']})
            print('response sent')
        
        except Exception as e:
            print(f"Error saving image: {e}")
            sio.emit('imageResponse', {"response": "Error saving image"})

        # print('wait')
        # if 'image' in data:
        #     file_data = data['image']
        #     # if file_data.startwith('data:image'):
        #     file_data = file_data.split(',')[1]

        #     image_data = base64.b64decode(file_data)

        #     filename = 'received_image.jpg'
        #     with open(filename, 'wb') as f:
        #         f.write(image_data)
            
        #     print(f"File received and saved as {filename}")

        #     file_data = b''
        #     if sio.connected:
        #         sio.emit('imageResponse', {"response": "image is received"})
        #         print(f"Image is received, total size: {len(image_data)} bytes")
        #     else:
        #         print("Error: Not connected to the server when trying to emit imageResponse")
            # sio.emit('imageResponse', {"response": "image is received"})
            # print(f"Image is received, total size: {len(image_data)} bytes")

    @sio.event
    def disconnect():
        print('Disconnected from server')
        global connections
        for value in connections:
            if isinstance(value, dict) and value.get('socketid') == sio.sid:
                connections.remove(value)
                print(f"Connection {sio.sid} removed from the list.")
                break

    def connect_to_server():
        # try:
        #     sio.connect('https://nodelink-guxh.onrender.com')
        # except:
        #     sio.connect('http://localhost:3000')
        # sio.connect('http://localhost:3000')
        sio.connect('https://nodelink-guxh.onrender.com')
        # sio.wait()


    def send_to_specific_user(target_socket_id, message_data):
        sio.emit('message', message_data, room=target_socket_id)
        print(f"Message sent to user with socket ID: {target_socket_id}")

    def send_image_to_user(target_socket_id, image_path):
        with open(image_path, 'rb') as img_file:
            image_data = img_file.read()
        sio.emit('send_image', image_data, room=target_socket_id)
        print(f"Image sent to user with socket ID: {target_socket_id}")


    check = ''

    if __name__ == '__main__':
        try:
            connect_to_server()
            while True:
                object = {'message': random.randint(1000, 10000000)}
                # time.sleep(2)
                if check == 'n':
                    sio.emit('message', object)
                    # check = 'y'
                elif check == 'y':
                    sio.emit('reply', {'message': random.randint(1000, 10000000)})
                    check = 'q'
                else:
                    pass
        except KeyboardInterrupt:
            print("Exiting...")
        finally:
            sio.disconnect()
except:
    print('Server is not found')
    # os.system('nodemon main.py')
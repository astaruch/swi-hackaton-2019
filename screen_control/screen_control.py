#!/usr/bin/env python

import websocket
import pyautogui

try:
    import thread
except ImportError:
    import _thread as thread
import time

def move_mouse(x, y):
    # print('move_mouse', x, y)
    pyautogui.moveTo(x, y)
    return

def left_click():
    print('left click')
    pyautogui.click()

def right_click():
    print('right click')
    pyautogui.rightClick()

def double_click():
    print('double click')
    pyautogui.doubleClick()

def middle_click():
    print('middle click')
    pyautogui.middleClick()

def scroll(val):
    print('scroll', val)
    pyautogui.scroll(val)

def mouse_down():
    print('mouse down')
    pyautogui.mouseDown()

def mouse_up():
    print('mouse up')
    pyautogui.mouseUp()

def copy():
    print('copy')
    pyautogui.hotkey('ctrl', 'c')

def paste():
    print('paste')
    pyautogui.hotkey('ctrl', 'v')

def key_down(key_name):
    print('key down', key_name)
    pyautogui.keyDown(key_name)

def key_up(key_name):
    print('key up', key_name)
    pyautogui.keyUp(key_name)

def on_message(ws, message):
    # print(message)
    data = message.split(' ')
    a = data[0] # action
    if a == 'move':
        x = int(float(data[1]))
        y = int(float(data[2]))
        move_mouse(x, y)
    elif a == 'click': left_click()
    elif a == 'rightclick': right_click()
    elif a == 'doubleclick': double_click()
    elif a == 'middleclick': middle_click()
    elif a == 'scroll': scroll(int(float(data[1])))
    elif a == 'mousedown': mouse_down()
    elif a == 'mouseup': mouse_up()
    elif a == 'copy': copy()
    elif a == 'paste': paste()
    elif a == 'keydown': key_down(data[1])
    elif a == 'keyup': key_up(data[1])

def on_error(ws, error):
    print(error)

def on_close(ws):
    print("### closed ###")


if __name__ == "__main__":
    websocket.enableTrace(True)
    ws = websocket.WebSocketApp("ws://localhost:9999/",
                              on_message = on_message,
                              on_error = on_error,
                              on_close = on_close)
    ws.run_forever()

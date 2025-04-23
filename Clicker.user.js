// ==UserScript==
// @name         Clicker - Slack
// @namespace    BANC
// @version      2024-09-01
// @description  Semi-automatic annotating tool
// @author       You
// @match        https://app.slack.com/client/TMA25RFGX*
// @match        https://spelunker.cave-explorer.org
// @icon         https://www.google.com/s2/favicons?sz=64&domain=slack.com
// @grant        none
// ==/UserScript==

/* globals viewer, submit */

(function() {

  function slack() {
    'use strict';

    const styles = document.createElement('style')
    styles.type = 'text/css'
    document.head.appendChild(styles)
    styles.textContent = `
      #clicker {
        position: absolute;
        top: 0;
        left: 50%;
        transform: translateX(-50%);
        z-index: 1;
        background-color: #414141;
        border: 1px solid #9D9D9D;
      }

      .full {
        height: 400px;
        width: 875px;
      }

      .minimized {
        height: 50px;
        width: 120px;
      }

      .full-minimize-button {
        position: relative;
        left: 760px;
        bottom: 25px;
      }

      .minimized-minimize-button {
        position: static;
      }

      #clicker-input,
      #clicker-todo,
      #clicker-outdated {
        width: 200px;
        height: 300px;
        margin: 10px 0 0 15px;
      }

      #clicker-button-container {
        vertical-align: top;
        display: inline-block;
        margin: 40px 0 0 25px;
      }

      #clicker button {
        display: block;
        background-color: #EB8D00;
        width: 140px;
        height: 60px;
        font-size: 16pt;
        color: white;
        margin: 10px;
      }

      #clicker button.small {
        display: inline-block;
        width: 100px;
        height: 30px;
      }

      #clicker-add.small {
        margin-left: 60px;
      }

      #clicker-label {
        margin-left: 70px;
        vertical-align: text-bottom;
      }

      #clicker-save-label.small {
        margin-left: 20px;
      }
    `

    const container = document.createElement('div')
    container.id = 'clicker'
    container.classList.add('full')
    document.body.appendChild(container)

    const html = `
      <div id="clicker-wrapper">
        <textarea id="clicker-input"></textarea><textarea id="clicker-todo" readonly></textarea><textarea id="clicker-outdated" readonly></textarea>
        <div id="clicker-button-container">
          <button id="clicker-next">Next</button>
          <button id="clicker-retry">Retry</button>
          <button id="clicker-save-outdated">Outdated</button>
          <button id="clicker-clear-outdated">Clear Outdated</button>
        </div>
        <button id="clicker-add" class="small">Add</button>
        <input type="text" id="clicker-label" /><button id="clicker-save-label" class="small">Save</button>
        <button id="clicker-auto" class="small">Auto (off)</button>
      </div>
      <button id="clicker-change-size" class="small full-minimize-button">minimize</button>
    `
    container.innerHTML = html

    let ids = []
    let label = localStorage.getItem('clicker-label') || ''
    let currentId = null
    let submitButton, postArea

    function getSlackControls() {
      submitButton = document.querySelector('body > div.p-client_container > div > div > div.p-client_workspace_wrapper > div.p-client_workspace > div.p-client_workspace__layout > div:nth-child(2) > div:nth-child(2) > div > div.p-file_drag_drop__container > div.workspace__primary_view_footer.p-workspace__primary_view_footer--float > div > div > div.p-message_pane_input_inner_main > div > div > div > div.c-wysiwyg_container__footer.c-wysiwyg_container__footer--with_formatting > div.c-wysiwyg_container__suffix > span > button.c-button-unstyled.c-icon_button.c-icon_button--size_x-small.c-wysiwyg_container__button.c-wysiwyg_container__button--send.c-icon_button--default')

      postArea = document.querySelector('.ql-editor p')
    }

    function getIdsFromLS() {
      let lsIds = localStorage.getItem('clicker-ids') || ''
      if (!lsIds.length) {
        ids = []
        return
      }

      ids = lsIds.split(';')
      document.getElementById('clicker-todo').value = ids.join('\r\n')
    }

    function saveIdsToLS() {
      localStorage.setItem('clicker-ids', ids.join(';'))
    }

    function updateTodo() {
      document.getElementById('clicker-todo').value = ids.join('\r\n')
      saveIdsToLS()
    }

    function add() {
      let inputIds = document.getElementById('clicker-input').value

      if (inputIds.indexOf(';') === -1) {
        inputIds = inputIds
          .replaceAll('\r\n', ',')
          .replaceAll('\n\r', ',')
          .replaceAll('\n', ',')
          .replaceAll('\r', ',')
          .replaceAll('\t', ',')
          .replaceAll(' ', ',')

        do {
          inputIds = inputIds.replaceAll(',,', ',')
        }
        while (inputIds.indexOf(',,') !== -1)

        inputIds = inputIds.split(',')
      }
      else {
        inputIds = inputIds.split(';')
      }

      ids = [...new Set([...ids, ...inputIds])]
    }

    window.submit = function submit(id, label) {
      getSlackControls()
      const output = id + '! ' + label
      postArea.textContent = output
      setTimeout(() => {
        submitButton.click()
      }, 100)
    }

    function displayOutdated() {
      let outdated = localStorage.getItem('clicker-outdated') || ''
      if (outdated) {
        outdated = outdated.split(',').join('\r\n')
      }
      document.getElementById('clicker-outdated').value = outdated
    }

    getIdsFromLS()
    document.getElementById('clicker-label').value = label
    displayOutdated()


    document.getElementById('clicker-add').addEventListener('click', e => {
      add()
      document.getElementById('clicker-input').value = ''
      updateTodo()
    })

    document.getElementById('clicker-save-label').addEventListener('click', e => {
      label = document.getElementById('clicker-label').value
      localStorage.setItem('clicker-label', label)
    })

    document.getElementById('clicker-next').addEventListener('click', e => {
      do {
        if (!ids.length) {
          return alert('finished')
        }
        currentId = ids.pop()
      } while (!currentId)
      updateTodo()
      submit(currentId, label)
    })

    document.getElementById('clicker-retry').addEventListener('click', e => {
      submit(currentId, label)
    })

    document.getElementById('clicker-save-outdated').addEventListener('click', e => {
      let outdated = localStorage.getItem('clicker-outdated') || []
      if (outdated.length) {
        outdated = outdated.split(',')
      }
      outdated.push(currentId)
      document.getElementById('clicker-outdated').value = outdated.join('\r\n')
      localStorage.setItem('clicker-outdated', outdated.join(','))
    })

  document.getElementById('clicker-clear-outdated').addEventListener('dblclick', e => {
    document.getElementById('clicker-outdated').value = ''
    localStorage.removeItem('clicker-outdated')
  })

  const multipleButton = document.createElement('button')
  multipleButton.id = 'submit-multiple'
  multipleButton.classList.add('submit-multiple')
  multipleButton.style.cssText = 'position: absolute; background-color: orange; color: white; padding: 20px; font-size: 18px; left: 400px; top: 60px;'
  multipleButton.textContent = 'submit'
  multipleButton.addEventListener('click', e => {
    const regex = /\[\[\s*(\d+)\s+(\d+)\s+(\d+)\]/
    let match = e.target.parentElement.textContent.match(regex)
    match = match.slice(1, 4).join(' ')
    let previousSibling = e.target.closest('.c-virtual_list__item').previousElementSibling
    // if red line separating read and unread messages is visible, we have to go back one element more
    if(previousSibling.hasAttribute('aria-label') && previousSibling.getAttribute('aria-label') === 'Start of unread messages.') {
      previousSibling = previousSibling.previousElementSibling
    }

    const annotation = previousSibling.getElementsByClassName('p-rich_text_section')[0].textContent.split('! ')[1]
    submit(match, annotation)
  })

  let observer
  let observerTurnedOn = false
  document.getElementById('clicker-auto').addEventListener('click', e => {
    const target = document.getElementById('message-list')
    const list = document.getElementById('message-list')
    const messages = list.getElementsByClassName('c-virtual_list__item')
    const clicker = document.getElementById('clicker')
    const clickerColor = clicker.style.backgroundColor
    let clicked = false
    observer = new MutationObserver((mutationList, observer) => {
      if (clicked) return
      for (const mutation of mutationList) {
        for (const node of mutation.addedNodes) {
          if (node.querySelector('code')) {
            if (node.textContent.includes('succeeded:') || node.textContent.includes('already has an annotation')) {
              document.getElementById('clicker-next').click()
              clicked = true
              setTimeout(() => {clicked = false}, 1000) // eslint-disable-line no-loop-func
              return
            }
            else if (node.textContent.includes('Multiple')) {
              const regex = /\[\[\s*(\d+)\s+(\d+)\s+(\d+)\]/
              let match = node.textContent.match(regex)
              match = match.slice(1, 4).join(' ')
              const annotation = localStorage.getItem('clicker-label')
              submit(match, annotation)
              clicked = true
              setTimeout(() => {clicked = false}, 1000) // eslint-disable-line no-loop-func
              return
            }
          }
          else if (node.textContent.includes('reply')) {
            setTimeout(() => {document.getElementById('clicker-retry').click()}, 5000)
          }
        }
      }
    })
    if (!observerTurnedOn) {
      observer.observe(target, {childList: true, subtree: true})
      e.target.textContent = 'Auto (on)'
    }
    else {
      observer.disconnect()
      e.target.textContent = 'Auto (off)'
    }
    observerTurnedOn = !observerTurnedOn
  })

  let isMinimized = localStorage.getItem('clicker-is-minimized') === 'true'
  updateMinimization()

  function updateMinimization() {
    const btn = document.getElementById('clicker-change-size')
    if (isMinimized) {
      container.classList.replace('full', 'minimized')
      document.getElementById('clicker-wrapper').style.display = 'none'
      btn.textContent = 'maximize'
      btn.classList.replace('full-minimize-button', 'minimized-minimize-button')
    }
    else {
      container.classList.replace('minimized', 'full')
      document.getElementById('clicker-wrapper').style.display = 'block'
      btn.textContent = 'minimize'
      btn.classList.replace('minimized-minimize-button', 'full-minimize-button')
    }
  }

  document.getElementById('clicker-change-size').addEventListener('click', e => {
    isMinimized = !isMinimized
    updateMinimization()
    localStorage.setItem('clicker-is-minimized', isMinimized)
  })

  document.addEventListener('mouseover', e => {
    if (e.target.classList.contains('p-rich_text_block--no-overflow')) {
      if (e.target.textContent.startsWith('Multiple')) {
        if (!e.target.getElementsByClassName('submit-multiple').length) {
          e.target.appendChild(multipleButton)
        }
      }
    }
  })

  }

  function neuroglancer() {
    document.body.addEventListener('keyup', e => {
      if (e.key === '`') {
        let allCoords = localStorage.getItem('all-coords') || ''

        if (allCoords.length) {
          allCoords = JSON.parse(allCoords)
        }
        else {
          allCoords = []
        }

        const coords = Array.from(viewer.position.coordinates_).map(Math.floor)
        coords[1] += 10
        const segId = viewer.mouseState.pickedValue
        if (coords) {
          allCoords.push(segId + ':' + coords.join(','))
          localStorage.setItem('all-coords', JSON.stringify(allCoords))
        }
      }
    })

    document.querySelector('#neuroglancer-container > div > div.neuroglancer-viewer-top-row > div.neuroglancer-position-widget > div.neuroglancer-icon').addEventListener('contextmenu', e => {
      let allCoords = localStorage.getItem('all-coords') || ''
      if (allCoords.length) {
        allCoords = JSON.parse(allCoords)
      }
      else {
        allCoords = []
      }

      navigator.clipboard.writeText(allCoords.join(';'))
      localStorage.removeItem('all-coords')
    })
  }



  if (window.location.href.includes('slack')) {
    slack()
  }
  else {
    setTimeout(neuroglancer, 3000)
  }
})();

  document.addEventListener('DOMContentLoaded', () => {
      loadGroups();
      loadOpenGroups();
      populateGroupSelect();

      document.getElementById('addGroup').addEventListener('click', () => {
          addGroup();
      });

      document.getElementById('save').addEventListener('click', () => {
          saveGroups();
      });

      document.getElementById('saveCurrentPage').addEventListener('click', () => {
          saveCurrentPage();
      });
  });

  function loadGroups() {
      chrome.storage.sync.get('groups', (data) => {
          const groups = data.groups || {};
          const container = document.getElementById('groups');
          container.innerHTML = '';
          Object.keys(groups).forEach((groupName) => {
              addGroup(groupName, groups[groupName]);
          });
      });
  }

  function addGroup(name = '', links = []) {
      const container = document.getElementById('groups');
      const groupDiv = document.createElement('div');
      groupDiv.className = 'group';
      groupDiv.innerHTML = `
          <div class="group-header">
              <input type="text" class="groupName" placeholder="Nombre del Grupo" value="${name}">
              <button class="remove-group">Eliminar Grupo</button>
          </div>
          <div class="links">
              ${links.map(link => `
                  <div class="link-container" draggable="true">
                      <input type="text" class="link" placeholder="Enlace" value="${link}">
                      <button class="remove-link">X</button>
                  </div>
              `).join('')}
              <button class="add-link">Añadir Enlace</button>
          </div>
      `;
      container.appendChild(groupDiv);

      groupDiv.querySelector('.add-link').addEventListener('click', () => {
          const linkContainer = document.createElement('div');
          linkContainer.className = 'link-container';
          linkContainer.draggable = true;
          linkContainer.innerHTML = `
              <input type="text" class="link" placeholder="Enlace">
              <button class="remove-link">X</button>
          `;
          groupDiv.querySelector('.links').insertBefore(linkContainer, groupDiv.querySelector('.add-link'));
          linkContainer.querySelector('.remove-link').addEventListener('click', () => {
              linkContainer.remove();
          });
          addDragAndDropHandlers(linkContainer);
      });

      groupDiv.querySelectorAll('.remove-link').forEach(button => {
          button.addEventListener('click', (event) => {
              event.target.parentElement.remove();
          });
      });

      groupDiv.querySelector('.remove-group').addEventListener('click', () => {
          container.removeChild(groupDiv);
      });

      groupDiv.querySelectorAll('.link-container').forEach(linkContainer => {
          addDragAndDropHandlers(linkContainer);
      });
  }

  function saveGroups() {
      const groups = {};
      document.querySelectorAll('.group').forEach(groupDiv => {
          const groupName = groupDiv.querySelector('.groupName').value;
          const links = [];
          groupDiv.querySelectorAll('.link').forEach(linkInput => {
              if (linkInput.value) {
                  links.push(linkInput.value);
              }
          });
          if (groupName && links.length > 0) {
              groups[groupName] = links;
          }
      });
      chrome.storage.sync.set({ groups }, () => {
          alert('Grupos guardados');
          populateGroupSelect();
      });
  }

  function loadOpenGroups() {
      chrome.storage.sync.get('groups', (data) => {
          const groups = data.groups || {};
          const container = document.getElementById('openGroups');
          container.innerHTML = '';
          Object.keys(groups).forEach((groupName) => {
              const button = document.createElement('button');
              button.textContent = `Abrir ${groupName}`;
              button.addEventListener('click', () => {
                  chrome.runtime.sendMessage({ action: 'openLinks', groupName });
              });
              container.appendChild(button);
          });
      });
  }

  function populateGroupSelect() {
      chrome.storage.sync.get('groups', (data) => {
          const groups = data.groups || {};
          const select = document.getElementById('groupSelect');
          select.innerHTML = '<option value="" disabled selected>Seleccionar grupo...</option>';
          Object.keys(groups).forEach((groupName) => {
              const option = document.createElement('option');
              option.value = groupName;
              option.textContent = groupName;
              select.appendChild(option);
          });
      });
  }

  function saveCurrentPage() {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          const url = tabs[0].url;
          const select = document.getElementById('groupSelect');
          const newGroupName = document.getElementById('newGroupName').value;

          let groupName = select.value;
          if (newGroupName) {
              groupName = newGroupName;
          }

          if (groupName) {
              chrome.runtime.sendMessage({ action: 'saveLink', groupName, url }, (response) => {
                  if (response.status === 'success') {
                      alert('Enlace guardado');
                      loadGroups();
                      populateGroupSelect();
                  }
              });
          } else {
              alert('Por favor, seleccione o ingrese un nombre de grupo.');
          }
      });
  }

  function addDragAndDropHandlers(linkContainer) {
      linkContainer.addEventListener('dragstart', (event) => {
          event.dataTransfer.setData('text/plain', null);
          linkContainer.classList.add('dragging');
      });

      linkContainer.addEventListener('dragend', () => {
          linkContainer.classList.remove('dragging');
      });

      linkContainer.addEventListener('dragover', (event) => {
          event.preventDefault();
          const draggingElement = document.querySelector('.dragging');
          if (draggingElement && draggingElement !== linkContainer) {
              const container = linkContainer.parentElement;
              const siblings = Array.from(container.querySelectorAll('.link-container'));
              const draggingIndex = siblings.indexOf(draggingElement);
              const targetIndex = siblings.indexOf(linkContainer);

              if (draggingIndex < targetIndex) {
                  container.insertBefore(draggingElement, linkContainer.nextSibling);
              } else {
                  container.insertBefore(draggingElement, linkContainer);
              }
          }
      });
  }

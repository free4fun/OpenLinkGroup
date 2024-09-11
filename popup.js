let groups = {};

function displayGroups() {
    const container = document.getElementById('groups');
    const openGroupsContainer = document.getElementById('openGroups');
    container.innerHTML = '';
    openGroupsContainer.innerHTML = '';

    for (const groupName in groups) {
        const groupDiv = document.createElement('div');
        groupDiv.className = 'group';
        groupDiv.innerHTML = `
            <div class="group-header">
                <input type="text" value="${groupName}" class="group-name">
                <button class="remove-group">Eliminar Grupo</button>
            </div>
            <div class="links"></div>
            <button class="add-link">Añadir Enlace</button>
        `;

        const linksContainer = groupDiv.querySelector('.links');
        groups[groupName].forEach(url => {
            const linkDiv = document.createElement('div');
            linkDiv.className = 'link-container';
            linkDiv.innerHTML = `
                <input type="text" value="${url}" class="link-url">
                <button class="remove-link">X</button>
            `;
            linksContainer.appendChild(linkDiv);
        });

        container.appendChild(groupDiv);

        const openGroupButton = document.createElement('button');
        openGroupButton.textContent = `Abrir ${groupName}`;
        openGroupButton.addEventListener('click', () => openGroup(groupName));
        openGroupsContainer.appendChild(openGroupButton);
    }

    updateGroupSelect();
}

function openGroup(groupName) {
    if (groups[groupName]) {
        groups[groupName].forEach(url => {
            chrome.tabs.create({ url: url });
        });
    }
}

function updateGroupSelect() {
    const select = document.getElementById('groupSelect');
    select.innerHTML = '<option value="" disabled selected>Seleccionar grupo...</option>';
    for (const groupName in groups) {
        const option = document.createElement('option');
        option.value = groupName;
        option.textContent = groupName;
        select.appendChild(option);
    }
}

function saveGroups() {
    chrome.storage.local.set({groups: groups}, function() {
        console.log('Grupos guardados');
    });
}

function loadGroups() {
    chrome.storage.local.get(['groups'], function(result) {
        groups = result.groups || {};
        displayGroups();
    });
}

document.addEventListener('DOMContentLoaded', () => {
    loadGroups();

    document.getElementById('addGroup').addEventListener('click', () => {
        const groupName = prompt('Nombre del nuevo grupo:');
        if (groupName) {
            groups[groupName] = [];
            displayGroups();
        }
    });

    document.getElementById('save').addEventListener('click', () => {
        const groupElements = document.querySelectorAll('.group');
        groups = {};
        groupElements.forEach(groupElement => {
            const groupName = groupElement.querySelector('.group-name').value;
            const links = Array.from(groupElement.querySelectorAll('.link-url')).map(input => input.value);
            groups[groupName] = links;
        });
        saveGroups();
        alert('Grupos guardados');
    });

    document.getElementById('saveCurrentPage').addEventListener('click', () => {
        const selectedGroup = document.getElementById('groupSelect').value;
        const newGroupName = document.getElementById('newGroupName').value;

        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            const currentUrl = tabs[0].url;
            if (selectedGroup) {
                groups[selectedGroup].push(currentUrl);
            } else if (newGroupName) {
                groups[newGroupName] = [currentUrl];
            }
            saveGroups();
            displayGroups();
        });
    });

    document.getElementById('groups').addEventListener('click', (e) => {
        if (e.target.classList.contains('remove-group')) {
            const groupName = e.target.closest('.group').querySelector('.group-name').value;
            delete groups[groupName];
            displayGroups();
        } else if (e.target.classList.contains('remove-link')) {
            const groupDiv = e.target.closest('.group');
            const groupName = groupDiv.querySelector('.group-name').value;
            const linkUrl = e.target.previousElementSibling.value;
            groups[groupName] = groups[groupName].filter(url => url !== linkUrl);
            displayGroups();
        } else if (e.target.classList.contains('add-link')) {
            const groupDiv = e.target.closest('.group');
            const groupName = groupDiv.querySelector('.group-name').value;
            const newUrl = prompt('Ingrese la URL del nuevo enlace:');
            if (newUrl) {
                groups[groupName].push(newUrl);
                displayGroups();
            }
        }
    });

    document.getElementById('openGroups').addEventListener('click', (e) => {
        if (e.target.tagName === 'BUTTON') {
            const groupName = e.target.textContent.replace('Abrir ', '');
            openGroup(groupName);
        }
    });

    document.getElementById('exportButton').addEventListener('click', () => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(groups));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", "groups_export.json");
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    });

    document.getElementById('importButton').addEventListener('click', () => {
        document.getElementById('importInput').click();
    });

    document.getElementById('importInput').addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                try {
                    const importedGroups = JSON.parse(e.target.result);
                    groups = importedGroups;
                    saveGroups();
                    displayGroups();
                    alert('Grupos importados con éxito');
                } catch (error) {
                    alert('Error al importar grupos: ' + error.message);
                }
            };
            reader.readAsText(file);
        }
    });
});

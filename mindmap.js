// Minimal mind map: draggable nodes, simple export
(function(){
  const container = document.getElementById('mindmap');
  const addBtn = document.getElementById('addNodeBtn');
  const input = document.getElementById('nodeText');
  const clearBtn = document.getElementById('clearNodes');
  const exportBtn = document.getElementById('exportMap');
  const exportArea = document.getElementById('exportArea');

  let nodes = [];
  let drag = { el: null, offsetX:0, offsetY:0 };

  function createNode(text, x=40, y=40){
    const id = 'n'+Date.now()+Math.floor(Math.random()*1000);
    const el = document.createElement('div');
    el.className = 'mm-node';
    el.setAttribute('data-id', id);
    el.style.left = x+'px';
    el.style.top = y+'px';
    el.innerText = text || 'Node';
    container.appendChild(el);

    el.addEventListener('mousedown', (e)=>{
      drag.el = el;
      drag.offsetX = e.clientX - el.getBoundingClientRect().left;
      drag.offsetY = e.clientY - el.getBoundingClientRect().top;
      el.classList.add('dragging');
    });

    document.addEventListener('mousemove', (e)=>{
      if(!drag.el) return;
      const rect = container.getBoundingClientRect();
      let nx = e.clientX - rect.left - drag.offsetX;
      let ny = e.clientY - rect.top - drag.offsetY;
      // constrain
      nx = Math.max(0, Math.min(rect.width - drag.el.offsetWidth, nx));
      ny = Math.max(0, Math.min(rect.height - drag.el.offsetHeight, ny));
      drag.el.style.left = nx + 'px';
      drag.el.style.top = ny + 'px';
    });

    document.addEventListener('mouseup', ()=>{
      if(drag.el) drag.el.classList.remove('dragging');
      drag.el = null;
    });

    nodes.push({ id, text, x, y });
    return el;
  }

  addBtn.addEventListener('click', ()=>{
    const txt = input.value.trim() || 'New Node';
    createNode(txt, 60 + Math.random()*200, 60 + Math.random()*120);
    input.value = '';
  });

  clearBtn.addEventListener('click', ()=>{
    nodes = [];
    container.innerHTML = '';
    exportArea.style.display = 'none';
  });

  exportBtn.addEventListener('click', ()=>{
    const map = Array.from(container.querySelectorAll('.mm-node')).map(el=>({
      id: el.dataset.id,
      text: el.innerText,
      left: el.style.left,
      top: el.style.top
    }));
    exportArea.style.display = 'block';
    exportArea.textContent = JSON.stringify(map, null, 2);
  });

  // support creating a sample map via index page button if window opener exists
  window.createSampleMap = function(){
    createNode('Central Idea', 300, 100);
    createNode('Topic A', 80, 220);
    createNode('Topic B', 360, 260);
    createNode('Summary', 600, 200);
  };

})();

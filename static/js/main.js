document.addEventListener('DOMContentLoaded', function() {
    // Initialize Cytoscape
    var cy = cytoscape({
        container: document.getElementById('cy'),
        style: [
            {
                selector: 'node',
                style: {
                    'background-color': '#3b82f6',
                    'label': 'data(id)',
                    'color': '#fff',
                    'text-valign': 'center',
                    'text-halign': 'center',
                    'font-size': '12px',
                    'width': '40px',
                    'height': '40px',
                    'border-width': 2,
                    'border-color': '#fff'
                }
            },
            {
                selector: 'edge',
                style: {
                    'width': 2,
                    'line-color': '#64748b',
                    'target-arrow-color': '#64748b',
                    'target-arrow-shape': 'triangle',
                    'curve-style': 'bezier'
                }
            },
            {
                selector: '.highlighted',
                style: {
                    'background-color': '#22c55e',
                    'border-color': '#fff',
                    'transition-property': 'background-color, border-color, border-width',
                    'transition-duration': '0.3s'
                }
            },
            {
                selector: '.current',
                style: {
                    'background-color': '#ef4444',
                    'width': '50px',
                    'height': '50px',
                    'transition-duration': '0.3s'
                }
            }
        ],
        layout: {
            name: 'grid',
            rows: 1
        }
    });

    const isDirectedInit = document.getElementById('directed-checkbox');
    
    // Helper: Add Log
    function addLog(message, isStep=false) {
        const panel = document.getElementById('log-content');
        const entry = document.createElement('div');
        entry.className = 'log-entry';
        if(isStep) entry.classList.add('log-step');
        entry.innerText = message;
        panel.appendChild(entry);
        panel.scrollTop = panel.scrollHeight;
    }

    // Add Node
    document.getElementById('add-node-btn').addEventListener('click', () => {
        const id = document.getElementById('node-name').value.trim();
        if (!id) return alert("Enter node name");
        
        if (cy.getElementById(id).length > 0) return alert("Node already exists");
        
        cy.add({
            group: 'nodes',
            data: { id: id },
            position: { x: 100 + Math.random() * 500, y: 100 + Math.random() * 400 }
        });
        
        document.getElementById('node-name').value = '';
        addLog(`Added Node: ${id}`);
    });

    // Add Edge
    document.getElementById('add-edge-btn').addEventListener('click', () => {
        const source = document.getElementById('edge-source').value.trim();
        const target = document.getElementById('edge-target').value.trim();
        const isDirected = document.getElementById('directed-checkbox').checked;
        
        if (!source || !target) return alert("Enter source and target");
        if (cy.getElementById(source).length === 0 || cy.getElementById(target).length === 0) {
            return alert("One or both nodes do not exist");
        }
        
        // Prevent duplicate edges if possible, but cytoscape handles it okay
        cy.add({
            group: 'edges',
            data: { source: source, target: target }
        });

        // Update Arrow style based on Directed/Undirected
        if (isDirected) {
             cy.style().selector('edge').style({'target-arrow-shape': 'triangle'}).update();
        } else {
             cy.style().selector('edge').style({'target-arrow-shape': 'none'}).update();
        }

        document.getElementById('edge-source').value = '';
        document.getElementById('edge-target').value = '';
        addLog(`Added Edge: ${source} - ${target}`);
    });

    // Clear Graph
    document.getElementById('clear-graph-btn').addEventListener('click', () => {
        cy.elements().remove();
        addLog("Graph cleared");
    });
    
    // Remove Selected
    document.getElementById('remove-selected-btn').addEventListener('click', () => {
        const selected = cy.$(':selected');
        if (selected.length === 0) {
            return alert("Select a node or edge on the graph first.");
        }
        selected.remove();
        addLog(`Removed ${selected.length} element(s)`);
    });
    
    // Toggle Direction Visuals
    document.getElementById('directed-checkbox').addEventListener('change', (e) => {
        if (e.target.checked) {
             cy.style().selector('edge').style({'target-arrow-shape': 'triangle'}).update();
        } else {
             cy.style().selector('edge').style({'target-arrow-shape': 'none'}).update();
        }
    });

    // Generate Random Graph
    document.getElementById('random-graph-btn').addEventListener('click', () => {
        cy.elements().remove(); // Clear existing
        const isDirected = document.getElementById('directed-checkbox').checked;
        
        // Settings
        const numNodes = 6 + Math.floor(Math.random() * 5); // 6 to 10 nodes
        const nodes = [];
        const edges = [];
        const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        
        // Create Nodes
        for (let i = 0; i < numNodes; i++) {
            const id = alphabet[i];
            nodes.push({
                group: 'nodes',
                data: { id: id },
                position: { x: 100 + Math.random() * 600, y: 100 + Math.random() * 400 }
            });
        }
        
        // Create Edges
        // Ensure connectivity mostly, but random
        for (let i = 0; i < numNodes; i++) {
            const source = alphabet[i];
            // Try to connect to 1-3 other nodes
            const numEdges = 1 + Math.floor(Math.random() * 2);
            for (let j = 0; j < numEdges; j++) {
                const targetIndex = Math.floor(Math.random() * numNodes);
                const target = alphabet[targetIndex];
                
                if (source !== target) {
                     // Check if edge exists (simple check)
                    const exists = edges.some(e => 
                        (e.data.source === source && e.data.target === target) ||
                        (!isDirected && e.data.source === target && e.data.target === source)
                    );
                    
                    if (!exists) {
                        edges.push({
                            group: 'edges',
                            data: { source: source, target: target }
                        });
                    }
                }
            }
        }
        
        cy.add([...nodes, ...edges]);
        
        // Apply Direction Style
        if (isDirected) {
             cy.style().selector('edge').style({'target-arrow-shape': 'triangle'}).update();
        } else {
             cy.style().selector('edge').style({'target-arrow-shape': 'none'}).update();
        }
        
        cy.layout({ name: 'circle' }).run(); // Use circle layout for neatness
        addLog(`Generated Random Graph with ${numNodes} nodes.`);
    });

    // Run Algorithm
    document.getElementById('run-btn').addEventListener('click', async () => {
        const startNode = document.getElementById('start-node').value.trim();
        const algorithm = document.getElementById('algorithm-select').value;
        const isDirected = document.getElementById('directed-checkbox').checked;
        
        if (!startNode) return alert("Enter start node");
        if (cy.getElementById(startNode).length === 0) return alert("Start node not found");
        
        // Reset styles
        cy.elements().removeClass('highlighted current');
        
        // Prepare data
        const nodes = cy.nodes().map(n => ({ id: n.id() }));
        const edges = cy.edges().map(e => ({ source: e.data('source'), target: e.data('target') }));
        
        addLog(`Running ${algorithm.toUpperCase()} from ${startNode}...`);
        
        try {
            const response = await fetch('/api/traversal', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    nodes,
                    edges,
                    startNode,
                    algorithm,
                    isDirected
                })
            });
            
            const result = await response.json();
            if (result.error) {
                alert("Error: " + result.error);
                return;
            }
            
            animateTraversal(result.path);
            
        } catch (err) {
            console.error(err);
            alert("Failed to connect to backend");
        }
    });
    
    function animateTraversal(path) {
        if (!path || path.length === 0) {
            addLog("No path found.");
            return;
        }
        
        let i = 0;
        addLog(`Path: ${path.join(' -> ')}`);
        
        function step() {
            if (i >= path.length) return;
            
            const nodeId = path[i];
            const node = cy.getElementById(nodeId);
            
            // Highlight prev node as visited (green)
            if (i > 0) {
                const prevNode = cy.getElementById(path[i-1]);
                prevNode.removeClass('current');
                prevNode.addClass('highlighted');
                
                // Highlight edge if it exists
                // Note: This logic assumes simple direct connection traversal
                // For exact edge highlighting we need more info from backend, but this is visual enough
                const edge = prevNode.edgesTo(node);
                if(edge.length > 0) edge.addClass('highlighted');
                // For undirected, check reverse too
                const edgeRev = node.edgesTo(prevNode);
                if(edgeRev.length > 0) edgeRev.addClass('highlighted');
            }
            
            // Highlight current node (red/active)
            node.addClass('current');
            
            addLog(`Visiting: ${nodeId}`, true);
            
            i++;
            
            // Get speed from slider (inverted: lower value = faster, higher value = slower wait)
            // Wait, slider is min=100 (fast) max=2000 (slow).. actually label said Slow <-> Fast.
            // Let's standardise: Left=Slow (High Delay), Right=Fast (Low Delay).
            // HTML Slider: min=100 max=2000.
            // If user drags right (max), it should be FAST. So delay should be small.
            // If user drags left (min), it should be SLOW. So delay should be big.
            // Current HTML: min=100, max=2000, value=800.
            // Let's invert in JS or change HTML logic. 
            // Better: Fix HTML logic? No, let's just read and compute delay.
            // Let's assume the slider value IS the delay in ms.
            // 100ms = Fast. 2000ms = Slow.
            // So dragging LEFT (to 100) is FAST. Dragging RIGHT (to 2000) is SLOW.
            // The HTML label says "(Slow <-> Fast)". Usually Left is Slow, Right is Fast.
            // So Left (min) should be Slow (High Delay). Right (max) should be Fast (Low Delay).
            // Inverted Logic: 
            // Slider Left (Low Value) -> Slow Speed (High Delay)
            // Slider Right (High Value) -> Fast Speed (Low Delay)
            // Slider Range: 100 to 2000
            
            const sliderValue = parseInt(document.getElementById('speed-slider').value);
            // 2100 - 100 = 2000ms (Slow)
            // 2100 - 2000 = 100ms (Fast)
            const delay = 2100 - sliderValue;
            
            setTimeout(step, delay); 
        }
        
        step();
    }
});

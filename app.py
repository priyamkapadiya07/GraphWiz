from flask import Flask, render_template, request, jsonify
from collections import deque

app = Flask(__name__)

def bfs_algorithm(graph, start_node):
    if start_node not in graph:
        return []
    
    visited = []
    queue = deque([start_node])
    visited_set = {start_node}
    
    traversal_path = []
    
    while queue:
        vertex = queue.popleft()
        traversal_path.append(vertex)
        visited.append(vertex)
        
        # Sort neighbors for consistent output
        neighbors = sorted(graph.get(vertex, []))
        for neighbor in neighbors:
            if neighbor not in visited_set:
                visited_set.add(neighbor)
                queue.append(neighbor)
                
    return traversal_path

def dfs_algorithm(graph, start_node):
    if start_node not in graph:
        return []

    visited = set()
    traversal_path = []
    
    def dfs_recursive(node):
        visited.add(node)
        traversal_path.append(node)
        
        neighbors = sorted(graph.get(node, []))
        for neighbor in neighbors:
            if neighbor not in visited:
                dfs_recursive(neighbor)
                
    dfs_recursive(start_node)
    return traversal_path

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/traversal', methods=['POST'])
def get_traversal():
    try:
        data = request.json
        graph_data = data.get('graph', {})
        start_node = data.get('startNode')
        algorithm = data.get('algorithm')
        
        nodes = data.get('nodes', [])
        edges = data.get('edges', [])
        is_directed = data.get('isDirected', False)
        
        adj_list = {node['id']: [] for node in nodes}
        
        for edge in edges:
            u, v = edge['source'], edge['target']
            if u in adj_list:
                adj_list[u].append(v)
            if not is_directed:
                if v in adj_list:
                    adj_list[v].append(u)
                    
        if algorithm == 'bfs':
            path = bfs_algorithm(adj_list, start_node)
        elif algorithm == 'dfs':
            path = dfs_algorithm(adj_list, start_node)
        else:
            return jsonify({'error': 'Invalid algorithm'}), 400
            
        return jsonify({'path': path})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)

'use strict';

// see https://blog.phronemophobic.com/treemaps-are-awesome.html
// see https://observablehq.com/@d3/treemap/2
// see https://observablehq.com/@d3/zoomable-treemap
import * as d3 from 'd3';

// Sample data: checked out Python git repo
// du --apparent-size -b | grep -v './.git' > du-output.txt
import data from '../data/du-output.txt'
import * as page from './page.js'

// Examples use ObservableHQs uid(....)
// limits: return is not a function, href is relative
var idCt = 0;
function newId(prefix) {
  prefix = !!prefix ? prefix : 'seq-id'
  const ret = {
    id : `${prefix}-${idCt}`,
    href : `#${prefix}-${idCt}`
  };
  idCt = idCt + 1;
  return ret;
}


function hierarchical_treemap(tree, parentD3, width, height) {
  // based on https://observablehq.com/@d3/nested-treemap

  // Specify the color scale.
  // const color = d3.scaleOrdinal(tree.children.map(d => d.name), d3.schemeTableau10).unknown('#fff');



  const tiling = d3.treemapSquarify; // d3.treemapBinary d3.treemapSquarify d3.treemapSliceDice d3.treemapSlice d3.treemapDice

   // Compute the layout.
  const root = d3.treemap()
    .tile(tiling)
    .size([width, height])
    .paddingOuter(6)
    .paddingTop(19)
    .paddingInner(2)
    .round(true)
  (d3.hierarchy(tree)
      .sum(d => !!d.children.length ? 0 : d.size)
      .sort((a, b) => {
           if (a.data.unrenderedPlaceholder || a.data.unrenderedPlaceholder) {
            return (a.data.unrenderedPlaceholder ? 1 : 0) - (b.data.unrenderedPlaceholder ? 1 : 0); // reversed, unrendered placeholders to the end
           } else {
            return b.value - a.value;
           }
      })); // called on node, not on data

  // find meaningful height of root (max depth meaningful node)
  var maxDepth = 0;
  root.each(n => {
    if (Math.abs(n.x1 - n.x0) > 0 && Math.abs(n.y1 - n.y0) > 0 && n.depth > maxDepth) {
      console.log(n)
      maxDepth = n.depth;
    }
  });
  console.log('Max meaningful depth', maxDepth);


  const color = d3.scaleSequential([-maxDepth * 1.5, maxDepth], d3.interpolateMagma);

  // Create the SVG container.
  const svg = parentD3.append("svg")
      .attr("viewBox", [0, 0, width, height])
      .attr("width", width)
      .attr("height", height)
      .attr("style", "max-width: 100%; height: auto; font: 10px sans-serif;");

  const shadow = newId("shadow");
  svg.append("filter")
      .attr("id", shadow.id)
    .append("feDropShadow")
      .attr("flood-opacity", 0.4)
      .attr("dx", 3)
      .attr("dx", 3)
      .attr("stdDeviation", 5);

  // level order grouping of nodes
  // sort to ensure that subsequent svg layers are in order
  const entiresByLevel = Array.from(d3.group(root, d => d.depth)).sort((a, b) => a[0] - b[0]);

  const node = svg.selectAll("g")
    .data(entiresByLevel) // iterable of [ <tree depth>, [ <level traversal of all nodes> ]] due to grouping
    .join("g") // per-depth level layers; each layer will have their respective nodes across all paths
      .attr("filter", `url(${shadow.href})`)
    .selectAll("g")
    .data(d => d[1]) // level order traversals
    .join("g")
      .attr("transform", d => `translate(${d.x0},${d.y0})`);

  // note that per-depth level layer g's are not part of the node selection

  // Append a tooltip.
  const format = d3.format(",d");
  node.append("title")
      .text(d => `${d.ancestors().reverse().map(d => d.data.name).join("/")}\n${formatSi(d.value)} (${format(d.value)})`);

  node.append("rect")
      .attr("id", d => (d.nodeId = newId("node")).id)
      .attr("fill", d => color(d.depth))
      // .attr("fill", d => { while (d.depth > 1) d = d.parent; return color(d.data.name); })
      .attr("fill-opacity", d => d.data.unrenderedPlaceholder ? 0.6 : 1)
      .attr("width", d => d.w = d.x1 - d.x0)
      .attr("height", d => d.h = d.y1 - d.y0);

  const textedNode = node.filter(d => d.w > 15 && d.h > 10);
  textedNode.append("clipPath")
      .attr("id", d => (d.clipId = newId("clip")).id)
    .append("use")
      .attr("xlink:href", d => d.nodeId.href);

  textedNode.append("text")
      .attr("clip-path", d => `url(${d.clipId.href})`)
    .selectAll("tspan")
    .data(d => [ d.data.name, formatSi(d.value) ])
    .join("tspan")
      .attr("fill-opacity", (d, i, nodes) => i === nodes.length - 1 ? 0.7 : null)
      .text(d => d);

  textedNode.filter(d => d.children).selectAll("tspan")
      .attr("dx", 3)
      .attr("y", 13);

  textedNode.filter(d => !d.children).selectAll("tspan")
      .attr("x", 3)
      .attr("y", (d, i, nodes) => `${(i === nodes.length - 1) * 0.3 + 1.1 + i * 0.9}em`);

  return svg.node();
}

function simple_treemap(filtered_tree, parentD3, width, height) {
  // based on https://observablehq.com/@d3/treemap/2

  // Specify the color scale.
  const color = d3.scaleOrdinal(filtered_tree.children.map(d => d.name), d3.schemeTableau10);

  const tiling = d3.treemapSquarify; // d3.treemapBinary d3.treemapSquarify d3.treemapSliceDice d3.treemapSlice d3.treemapDice

   // Compute the layout.
  const root = d3.treemap()
    .tile(tiling)
    .size([width, height])
    .padding(1)
    .round(true)
  (d3.hierarchy(filtered_tree)
      .sum(d => !!d.children.length ? 0 : d.size)
      .sort((a, b) => {
           if (a.data.unrenderedPlaceholder || a.data.unrenderedPlaceholder) {
            return (a.data.unrenderedPlaceholder ? 1 : 0) - (b.data.unrenderedPlaceholder ? 1 : 0); // reversed, unrendered placeholders to the end
           } else {
            return b.value - a.value;
           }
      })); // called on node, not on data


   // Create the SVG container.
  const svg = parentD3.append("svg")
      .attr("viewBox", [0, 0, width, height])
      .attr("width", width)
      .attr("height", height)
      .attr("style", "max-width: 100%; height: auto; font: 10px sans-serif;");

  // Add a cell for each leaf of the hierarchy.
  const leaf = svg.selectAll("g")
    .data(root.leaves())
    .join("g")
      .attr("transform", d => `translate(${d.x0},${d.y0})`);

  // Append a tooltip.
  const format = d3.format(",d");
  leaf.append("title")
      .text(d => `${d.ancestors().reverse().map(d => d.data.name).join("/")}\n${formatSi(d.value)} (${format(d.value)})`);

  // Append a color rectangle.
  leaf.append("rect")
    .attr("id", d => (d.leafId = newId('leaf')).id)
    .attr("fill", d => { while (d.depth > 1) d = d.parent; return color(d.data.name); })
    .attr("fill-opacity", d => d.data.unrenderedPlaceholder ? 0.4 : 0.6)
    .attr("width", d => d.w = d.x1 - d.x0)
    .attr("height", d => d.h = d.y1 - d.y0);

  const textedLeaf = leaf.filter(d => d.w > 15 && d.h > 10);
  textedLeaf.append("clipPath")
    .attr("id", d => (d.clipId = newId("clip")).id)
    .append("use")
      .attr("xlink:href", d => d.leafId.href);

  // Append multiline text. The last line shows the value and has a specific formatting.
  textedLeaf.append("text")
    .attr("clip-path", d => `url(${d.clipId.href})`)
    .selectAll("tspan")
    .data(d => [ d.data.name, formatSi(d.value) ])
    .join("tspan")
      .attr("x", 3)
      .attr("y", (d, i, nodes) => `${(i === nodes.length - 1) * 0.3 + 1.1 + i * 0.9}em`)
      .attr("fill-opacity", (d, i, nodes) => i === nodes.length - 1 ? 0.6 : null)
      .text(d => d);
}

function loaded() {
  const p = page.init();
  p.addLink('Flat', () => {
    p.clearLower();
    simple_treemap(filtered_tree, p.getLowerD3(), p.getLowerWidth(), p.getLowerHeight());
  });
  p.addLink('Hierarchical', () => {
    p.clearLower();
    hierarchical_treemap(filtered_tree, p.getLowerD3(), p.getLowerWidth(), p.getLowerHeight());
  });

  console.log(`data size: ${data.length}`);
  const tree = {
    name : '.',
    children: [],
    childMap: {},
    size : 0,
    sizeSi : 0
  };

  data.trim().split('\n').forEach(line => {
    const match = line.match(/^(\d+)\s+(.+)$/);
    if (!match) return;

    const size = parseInt(match[1], 10);
    const pathElements = match[2].split('/');

    var tn = tree;
    for (var i = 1; i < pathElements.length; i++) {
      const pe = pathElements[i];
      if (!tn.childMap[pe]) {
        const newChild = {
          name : pe,
          children : [],
          childMap : {},
          size : 0,
          sizeSi : 0
        };
        tn.childMap[pe] = newChild;
        tn.children.push(newChild)
      }
      tn = tn.childMap[pe];
    }
    tn.size = size; // du uses kB by default, instruct it with -b to use bytes
    tn.sizeSi = formatSi(tn.size);
  });
  console.log('Directory size tree', tree);

  // filter for max 2 levels
  function traverse(renderSize, minRenderSize, descends, fromRoot) {
    const toRoot = {
      name : fromRoot.name,
      children : [],
      size : fromRoot.size
    };
    if (descends > 0) {
      var unrenderedSize = 0;
      var unrenderedCount = 0;
      var renderedCount = 0;
      for (var child of fromRoot.children) {
        const childRenderSize = renderSize * child.size / fromRoot.size;

        if (childRenderSize < minRenderSize) {
           unrenderedSize = unrenderedSize + child.size;
           unrenderedCount = unrenderedCount + 1;
        } else {
          const newChild = traverse(childRenderSize, minRenderSize, descends-1, child, newChild);
          toRoot.children.push(newChild);
          renderedCount = renderedCount + 1;
        }
      }
      if (unrenderedCount > 0 && renderedCount > 0) {
        toRoot.children.push({
          name : `... (${unrenderedCount} more)`,
          size : unrenderedSize,
          children : [],
          unrenderedPlaceholder : true
        });
      }
    }
    return toRoot;
  }
  const filtered_tree = traverse(1000000, 100, 8, tree);
  console.log('Filtered tree', tree);

  // simple_treemap(filtered_tree);
  hierarchical_treemap(filtered_tree, p.getLowerD3(), p.getLowerWidth(), p.getLowerHeight());
}

function formatSi(bytes, decimals = 2) {
  if (bytes < 0) return '' + bytes;

  const units = ["B", "KiB", "MiB", "GiB", "TiB", "PiB"];
  let unitIndex = 0;

  while (bytes >= 1024 && unitIndex < units.length - 1) {
    bytes /= 1024;
    unitIndex++;
  }

  return `${bytes.toFixed(decimals)} ${units[unitIndex]}`;
}

document.addEventListener('DOMContentLoaded', loaded);

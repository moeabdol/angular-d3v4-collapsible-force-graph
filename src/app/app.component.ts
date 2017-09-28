import { Component, OnInit, ViewEncapsulation } from '@angular/core';

import * as d3 from 'd3';

interface Node {
  name: string;
  children: Node[];
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class AppComponent implements OnInit {
  ngOnInit() {
    console.log('D3.js version:', d3['version']);

    this.collapsibleForceGraph();
  }

  collapsibleForceGraph() {
    const width = 960;
    const height = 500;
    let data, root, simulation, nodeSvg, nodeEnter, linkSvg, linkEnter;

    const svg = d3.select('app-root')
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', 'translate(40, 0)');

    d3.json('assets/readme.json', (err, json) => {
      if (err) { throw new Error('Bad data file!'); }

      data = <Node>{ name: json['name'], children: json['children'] };
      root = d3.hierarchy(data);

      update();
    });

    function update() {
      const nodes = flatten(root);
      const links = root.links();

      linkSvg = svg.selectAll('.link')
        .data(links);

      linkSvg.exit().remove();

      linkEnter = linkSvg.enter()
        .append('line')
        .attr('class', 'link');

      linkSvg = linkEnter.merge(linkSvg);

      nodeSvg = svg.selectAll('.node')
        .data(nodes);

      nodeSvg.exit().remove();

      nodeEnter = nodeSvg.enter()
        .append('g')
        .attr('class', 'node')
        .on('click', click)
        .call(d3.drag()
          .on('start', dragstarted)
          .on('drag', dragged)
          .on('end', dragended)
        );

      nodeEnter.append('circle')
        .attr('r', (d) => Math.sqrt(d.data.size) / 10 || 4.5)
        .attr('fill', color)
        .append('title')
        .text((d) => d.data.name);

      nodeSvg = nodeEnter.merge(nodeSvg);

      simulation = d3.forceSimulation()
        .force('link', d3.forceLink())
        .force('charge', d3.forceManyBody().strength(-5))
        .force('center', d3.forceCenter(width / 2, height / 2))
        .on('tick', ticked);

      simulation.nodes(nodes);
      simulation.force('link').links(links);
    }

    function ticked() {
      linkSvg
        .attr('x1', (d) => d.source.x)
        .attr('y1', (d) => d.source.y)
        .attr('x2', (d) => d.target.x)
        .attr('y2', (d) => d.target.y);

      nodeSvg
        .attr('transform', (d) => 'translate(' + d.x + ', ' + d.y + ')');
    }

    function flatten (rt) {
      const nodes = [];
      let i = 0;

      function recurse(node) {
        if (node.children) { node.children.forEach(recurse); }
        if (!node.id) {
          node.id = ++i;
        } else {
          ++i;
        }
        nodes.push(node);
      }
      recurse(rt);
      return nodes;
    }

    function color(d) {
      return d._children ? '#3182bd' : d.children ? '#c6dbef' : '#fd8d3c';
    }

    function click(d) {
      if (d.children) {
        d._children = d.children;
        d.children = null;
      } else {
        d.children = d._children;
        d._children = null;
      }
      update();
      simulation.restart();
    }

    function dragstarted(d) {
      if (!d3.event.active) { simulation.alphaTarget(0.3).restart(); }
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(d) {
      d.fx = d3.event.x;
      d.fy = d3.event.y;
    }

    function dragended(d) {
      if (!d3.event.active) { simulation.alphaTarget(0); }
      d.fx = null;
      d.fy = null;
    }
  }
}

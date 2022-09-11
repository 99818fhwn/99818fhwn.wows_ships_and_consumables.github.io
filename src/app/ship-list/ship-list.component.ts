import { Component, OnInit } from '@angular/core';
import * as xpath from "xpath-ts";
import axios from 'axios';
import { Ship } from '../ship';

@Component({
  selector: 'app-ship-list',
  templateUrl: './ship-list.component.html',
  styleUrls: ['./ship-list.component.scss']
})

export class ShipListComponent implements OnInit {

  readonly wowsBaseAddress: string = "https://wiki.wargaming.net";
  public ships : Ship[] = [];

  constructor() { }

  async ngOnInit(): Promise<void> {
    console.log("Start-Scraping");
    let shipetypesRefs = await this.scrapeWowsShipTypesRefs();
    let shipRefs = await this.scrapeWowsShipshRefs(shipetypesRefs);

    if(!shipRefs)
      return;
      
    shipRefs.forEach(async href => {
      let s = await this.scrapeWowsShip(href);

      if(s)
        this.ships.push(s);
    });

    console.log("Generated: " + this.ships.length + " ships");
  }


  fetchPage(url: string): Promise<string | undefined> {
    const HTMLData = axios
      .get(url)
      .then(res => res.data)
      .catch((error) => {
        console.error(`There was an error with ${error.config.url}.`);
        console.error(error.toJSON());
      });

    return HTMLData;
  }

  //Scrapes the wows wiki page for all available ship types.
  async scrapeWowsShipTypesRefs(): Promise<string[]> {
    var hRef = "/en/World_of_Warships";
    let html = await this.fetchPage(this.wowsBaseAddress + hRef);
    if (!html)
      return [];

    let doc = new DOMParser().parseFromString(html, "text/html");
    let nodes = doc.evaluate('//*[@id="mw-content-text"]/div[*]/big/a/@href', doc, null, XPathResult.ORDERED_NODE_ITERATOR_TYPE, null);
    if (!nodes)
      return [];

    console.log(nodes);

    return this.iterateToArray(nodes);
  }

  iterateToArray(result : XPathResult) : string[] {
    let arr : string[]= [];
    let value = result.iterateNext()
    while(value)
    {
      if(value.nodeValue)
        arr.push(value.nodeValue);

      value = result.iterateNext();
    }

    return arr;
  }

  //Scrapes the woki for all ships-
  async scrapeWowsShipshRefs(shipTypeHRefs: string[]): Promise<string[]> {
    let urls: string[] = [];
    await Promise.all(shipTypeHRefs.map(async shiptypeUrl => {
      let html = await this.fetchPage(this.wowsBaseAddress + shiptypeUrl);
      if (!html)
        return;

      let doc = new DOMParser().parseFromString(html, "text/html");
      let nodes = doc.evaluate('//*[@id="mw-content-text"]/div[*]/div[*]/center/a[1]/@href', doc, null, XPathResult.ORDERED_NODE_ITERATOR_TYPE, null);

      if (!nodes)
        return;

      this.iterateToArray(nodes).forEach(value => {
        urls.push(value);
      });
    }));
    
    console.log(urls);
    return urls;
  }


  //Scrapes the woki for all ships.
  async scrapeWowsShip(shipHRef: string): Promise<Ship | null> {


    let html = await this.fetchPage(this.wowsBaseAddress + shipHRef);
    if (!html)
      return null;

    let doc = new DOMParser().parseFromString(html, "text/html");
    let name = doc.evaluate('//*[@id="stockTTH"]/div/div[1]/div[2]/text()', doc, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null)?.singleNodeValue?.nodeValue;
    let type = doc.evaluate('//*[@id="stockTTH"]/div/div[3]/a[1]/text()', doc, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null)?.singleNodeValue?.nodeValue;
    let consumablesNames = doc.evaluate('//*[@id="mw-content-text"]/ul[2]/li[*]/a[1]/@title', doc, null, XPathResult.ORDERED_NODE_ITERATOR_TYPE, null);
    let consumables = this.iterateToArray(consumablesNames);


    if (!name || !type || !consumables)
      return null;

    let ship = new Ship(name, type, consumables)

    console.log(ship);

    return ship;
  }

  enumFromStringValue<T> (enm: { [s: string]: T}, value: string): T | undefined {
    return (Object.values(enm) as unknown as string[]).includes(value)
      ? value as unknown as T
      : undefined;
  }
}
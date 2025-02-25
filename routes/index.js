const { log } = require('console');
const express = require('express');
const path = require('path');
const router = express.Router();
const puppeteer = require('puppeteer'); 
const maptilerClient = require('@maptiler/client');

// Serve the index.html file for the root route
router.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../views/index.html'));
});


router.get('/scrap', (req, res) => {
  console.log('Scraping');
  let body = req.body;


  (async () => { 
    
    maptilerClient.config.apiKey = 'ACTRnPNd0QqJBTBckTXY';

    function delay(time) {
        return new Promise(function(resolve) { 
            setTimeout(resolve, time)
        });
     }

     async function moldPlace(res) {
        let toTransform = [];
        console.log(res.features[0].geometry.coordinates);
        if (res.features[0].geometry.coordinates.length > 1) {
            console.log('mas de uno');
            toTransform = res.features[0].geometry.coordinates[0][0];
        } else {
            console.log('uno solo');
            toTransform = res.features[0].geometry.coordinates[0];
        }
        const resultA = await maptilerClient.coordinates.transform(toTransform, {sourceCrs: 32721, targetCrs: 4326});
        inmueble.polygon = [];
        resultA.results.forEach(element => {
            point = {};
            point.lat = element.y;
            point.long = element.x;
            inmueble.polygon.push(point);
        });
    }

    async function postInmueble(item) {
        return await fetch('https://scrapserver-production.up.railway.app/inmuebles', {
          method: "POST",
          body: JSON.stringify(item)
        });
      }

	// Initiate the browser 
	const browser = await puppeteer.launch({
        headless: true,
        slowMo: 200,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        ignoreDefaultArgs: ['--disable-extensions'],
        defaultViewport: {
          width:1400,
          height:880
        }
    }); 
	 
	// Create a new page with the default browser context 
	const page = await browser.newPage(); 
    // await page.setDefaultTimeout(1000);

    
	// Go to the target website 
	await page.goto('https://www.catastro.gov.py/visor/?snc=geo');

    
    await page.waitForSelector('button[class="delete"]');
    await page.click('button[class="delete"]');
    
    
    let vueltas = 1;
    let isGolden = false;
    let isCuentas = false;
    first = true;

    // let zona = '14';
    // let manzana = '275';
    // let lote = '8';

    let zona = body.zona;
    let manzana = body.manzana;
    let lote = body.lote;

    empty = 0;

    let inmueble = {};
    
// while (lote < 25 o algo asi)
    while (Number(manzana) < 800) {

    while (Number(lote) < 100) {
        isGolden = false;
        isCuentas = false;
        inmueble = {};
        console.log(empty);
    if(empty < 15) {

        if (first) {       

    await page.click('a[id="buscadorControl"]');
    

    let elements = await page.$$('[id^="form-select-"]');
    elements.forEach(async (element) => {
        // console.log(await element.evaluate(el => el.id));
    });
    await page.click("#root > div > div > section > div:nth-child(2) > nav > div.panel-block > section > div:nth-child(2) > div:nth-child(2) > div > div > div");

    let options = await page.$$('li[id^="select2-form-select-"]');
    // console.log(await options[0].evaluate(el => el.id));

    await page.waitForSelector('li[id=' + await options[0].evaluate(el => el.id) + ']');
    await page.click('li[id=' + await options[0].evaluate(el => el.id) + ']');

    
    
    await page.click("#selector-tipo-cuenta > div:nth-child(1) > label > label");
    
    delay(2000);
    
    await page.click("#root > div > div > section > div:nth-child(2) > nav > div.panel-block > section > div:nth-child(2) > div:nth-child(3) > div > div > div");

    options = await page.$$('li[id^="select2-form-select-"]');
    console.log(await options[0].evaluate(el => el.id));

    await page.waitForSelector('li[id=' + await options[4].evaluate(el => el.id) + ']');
    await page.click('li[id=' + await options[4].evaluate(el => el.id) + ']');
    
    
    await page.type('input[placeholder="Zona"]', zona);
    await page.type('input[placeholder="Manzana"]', manzana);
    await page.type('input[placeholder="Lote"]', lote);
    
    await page.click("#buscar-parcela");        
    
        } else {
            await page.$eval('input[placeholder="Lote"]', el => el.value = '');
            await page.type('input[placeholder="Lote"]', lote);
            await page.click("#buscar-parcela");  
        }

        await page.on('response', async (response) => {
            
            if (!response.url().includes("https://www.catastro.gov.py/geoserver/gwc/service/wms?SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap") &&
                !response.url().includes("tile.openstreetmap.org") &&
                !response.url().includes("https://www.catastro.gov.py/static/media") &&
                !response.url().includes("https://www.catastro.gov.py/geoserver/ows?service=WFS&version111") &&
                !response.url().includes("data:image/png;base64")) {
                    if (response.url().includes("https://www.catastro.gov.py/api/v1/public/cuentas")) {
                        // console.log("Cuentas");
                        // console.log(await response.json());
                        if (!isCuentas){
                            isCuentas = true;
                            let res = await response.json();
                            inmueble = res;
                        }
                    } else {
                        let resp = {};
                        resp = await response.json();
                        if (resp.crs == null) {
                            console.log('VACIO!');
                            let but1 = await page.$('#root > div > div > section > div.column.no-padding > div.modal.is-active > div.modal-card > footer > button');
                            await but1.evaluate(b => b.click());
                            let but2 = await page.$('a[class="ol-popup-closer"]');
                            await but2.evaluate(b => b.click());
                            empty++;
                        } else {
                            if (!isGolden) {
                                // console.log('GOLDEN');
                                isGolden = true;
                                await moldPlace(await response.json());
                                let button = await page.$('a[class="ol-popup-closer"]');
                                await button.evaluate(b => b.click());
                                let res = await response.json();
                                inmueble = {...inmueble, ...res.features[0].properties};
                                empty = 0;

                                delete inmueble.mz;
                                inmueble.id ? inmueble.snc_id = inmueble.id : inmueble.snc_id = null;
                                delete inmueble.id;
                                delete inmueble.shape;
                                inmueble.m2 = Number(inmueble.superficieM2);
                                inmueble.m2t = Number(inmueble.superficie_tierra);

                                console.log(inmueble);

                                fetch('https://scrapserver-production.up.railway.app/inmuebles', {
                                    method: "POST",
                                    body: JSON.stringify(inmueble)
                                  });

                            } else {
                                // console.log('repeat');
                            }
                        }
                    }
                }
        });

        // await delay(2000);
        await page.waitForNetworkIdle({idleTime: 2000});

        lote = (Number(lote) + 1).toString();
        first = false;
        page.off('response');

        } else {
            'Its off'
            empty = 0;
            break;
        }
    } // while LOTE ends here
    
    manzana = (Number(manzana) + 1).toString();
    lote = '1';
    empty = 0;
    await page.$eval('input[placeholder="Manzana"]', el => el.value = '');
    await page.type('input[placeholder="Manzana"]', manzana);
}

    
    // await page.$eval('input[placeholder="Latitud"]', el => el.value = '-25.291147');
    // await page.$eval('input[placeholder="Longitud"]', el => el.value = '-57.565346');
    
    // await page.click('button[id="buscar-parcela"]');  

 

    // await page.waitForSelector('div[id="popup-content"]');
    // let element = await page.$('div[id="popup-content"]');
    // let value = await page.evaluate(el => el.textContent, element)
    // console.log(value);



	// const content = await page.content(); 
	// console.log(content); 
 
	// Closes the browser and all of its pages 
	// await browser.close(); 
})();

});

module.exports = router;

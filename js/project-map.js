var allProjects = {}
var projectList = []
var options = {
  headers: {
    'Accept': 'application/json',
    'Accept-Language': 'en'
  }
}
var tmProjectCentroids = {
  'type': 'FeatureCollection',
  'features': []
}

var tmProjectPolygons = {
  'type': 'FeatureCollection',
  'features': []
}
console.log(campaignTags)
campaignTags = campaignTags.split(',')
console.log('Campaign Tags: ', campaignTags)

var totalArea = 0, totalEdits = 0, totalMappers = 0
var totalRoads = 0, totalBuildings = 0, totalChangesets = 0
var countryList = countries.split(',')
console.log('Country List: ', countryList)
countryList.forEach((country, countryIndex) => {
  countryList[countryIndex] = country.trim().toLowerCase()
})

mapboxgl.accessToken = 'pk.eyJ1IjoiaG90IiwiYSI6IlBtUmNiR1kifQ.dCS1Eu9DIRNZGktc24IwtA'
var map = new mapboxgl.Map({
  container: 'map',
  logoPosition: 'bottom-left',
  // scrollZoom: false,
  // dragRotate: false,
  maxZoom: 18,
  minZoom: 1.25,
  zoom: 1.25,
  center: [0, 8],
  style: 'mapbox://styles/hot/cjepk5hhz5o9w2rozqj353ut4'
})


const loadMapLayers = () => {
  console.log('Load Map Layers')
  console.log('loadMapLayers() tmProjectPolygons: ', JSON.stringify(tmProjectPolygons))
  console.log('loadMapLayers() tmProjectCentroids: ', JSON.stringify(tmProjectCentroids))
  map.addSource('tmProjectPolygons', {
    'type': 'geojson',
    'data': tmProjectPolygons
  })
  map.addSource('tmProjectCentroids', {
    'type': 'geojson',
    'data': tmProjectCentroids
  })
  
  map.addLayer({
    'id': 'tm-projects-polygons',
    'type': 'fill',
    'source': 'tmProjectPolygons',
    'minzoom': 0,
    'maxzoom': 19,
    'paint': {
      'fill-opacity': 0.2,
      'fill-color': '#000000'
    }
  }, 'place-city-sm')
  
  map.addLayer({
    'id': 'tm-projects-black-circle',
    'type': 'circle',
    'source': 'tmProjectCentroids',
    'minzoom': 0,
    'maxzoom': 19,
    'paint': {
      'circle-radius': 5,
      'circle-opacity': 0.7,
      'circle-color': '#000000'
    }
  }, 'place-city-sm')
  
  map.addLayer({
    'id': 'tm-projects-symbol',
    'type': 'symbol',
    'source': 'tmProjectCentroids',
    'minzoom': 0,
    'maxzoom': 19,
    'layout': {
      'text-field': '+',
      'text-font': ['Open Sans Bold'],
      'text-offset': [-0.001, -0.03],
      'text-size': 10
    },
    'paint': {
      'text-color': '#FFFFFF'
    }
  }, 'place-city-sm')
  
}

map.on('load', function () {
  $('.mapboxgl-ctrl').addClass('hide')
  $('#loading-map').detach()
  map.addSource('countriesbetter', {
    'type': 'vector',
    'url': 'mapbox://hot.6w45pyli'
  })
  
  
})

fetch('/allProjects-minified-v2.json')
  .then(function (response) {
    return response.json()
  })
  .then(function (jsonData) {
    allProjects = jsonData
    fetch('/campaign-match.json')
      .then(function (response) {
        return response.json()
      })
      .then(function (jsonData) {
        campaignTags.forEach(campaignTag => {
          if (jsonData[campaignTag]) {
            projectList = projectList.concat(jsonData[campaignTag])
          }
        })
        var totalProjects = projectList.length
        projectList.forEach((project, projectCount) => {
          var feature = {
            'type': 'Feature',
            'properties': {},
            'geometry': {}
          }
          feature.properties['id'] = project
          feature.properties['name'] = allProjects[project][0]
          feature.properties['status'] = allProjects[project][1]
          feature.properties['campaignTag'] = allProjects[project][2]
          feature.properties['created'] = allProjects[project][3]
          feature.properties['lastUpdated'] = allProjects[project][4]
          feature.properties['lastActive'] = allProjects[project][6]
          feature.properties['changesets'] = allProjects[project][7]
          feature.properties['mappers'] = allProjects[project][8]
          feature.properties['roads'] = allProjects[project][9]
          feature.properties['buildings'] = allProjects[project][10]
          feature.properties['edits'] = allProjects[project][11]
          
          totalEdits += allProjects[project][11]
          totalMappers += allProjects[project][8]
          totalChangesets += allProjects[project][7]
          totalRoads += allProjects[project][9]
          totalBuildings += allProjects[project][10]
          feature.geometry['type'] = 'Point'
          feature.geometry['coordinates'] = allProjects[project][5]
          // console.log('From minified file: ', allProjects[project][5])
          // console.log('Point geometry: ', feature.geometry['coordinates'])
          // console.log('Point Feature: ', JSON.stringify(feature))
          // console.log('before pushing: ',JSON.stringify(tmProjectCentroids))
          // tmProjectCentroids.features.push(feature)
          // console.log('After pushing: ', JSON.stringify(tmProjectCentroids))
          // map.getSource('tmProjectCentroids').setData(tmProjectCentroids)
          options.url = 'https://s3.amazonaws.com/hotosm-stats-collector/' + project + '-aoi.json'
          // console.log('Fetching from, ', options.url)
          $.ajax({
            url: options.url,
            type: 'GET',
            dataType: 'json',
            success: function (result) {
              var polygonFeature = {
                'type': 'Feature',
                'properties': {},
                'geometry': {}
              }
              var aoi = result
              // console.log(typeof aoi)
              aoi = JSON.parse(JSON.stringify(aoi))
              // console.log(typeof aoi)
              // console.log(aoi.properties)
              polygonFeature.properties['area'] = aoi.properties.area
              totalArea += aoi.properties.area
              polygonFeature.geometry = aoi.geometry
              // console.log('Polygon geometry: ',aoi.geometry)
              tmProjectPolygons.features.push(polygonFeature)
              // map.getSource('tmProjectPolygons').setData(tmProjectPolygons)
              
              // console.log('projectCount: ', projectCount)
              if (projectCount === (totalProjects - 1)){
                // console.log('Last project reached')
                document.getElementById('Project-Area').innerHTML = formatedData(Math.round(totalArea))
                document.getElementById('Total-Map-Edits').innerHTML = formatedData(Math.round(totalEdits))
                document.getElementById('Community-Mappers').innerHTML = formatedData(Math.round(totalMappers))
                document.getElementById('Countries-Covered').innerHTML = countryList.length
                // console.log('tmProjectPolygons: ', tmProjectPolygons)
                // console.log('tmProjectCentroids: ', tmProjectCentroids)
                loadMapLayers()
              }
            },
            error: function (error) {
              console.log('Error')
            }
          })
        })
      })
  })



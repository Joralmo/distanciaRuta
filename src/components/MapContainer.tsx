import React, { useState, useEffect, Fragment } from 'react';
import ReactMapboxGl, {
    Marker,
    Layer,
    Popup,
    Image,
    Source,
} from 'react-mapbox-gl';
import { Plugins } from '@capacitor/core';
import PersonPinCircleIcon from '@material-ui/icons/PersonPinCircle';
import axios from 'axios';
import 'mapbox-gl/dist/mapbox-gl.css';
import './ExploreContainer.css';
const key = process.env.REACT_APP_TOKEN_MAP || "";

interface ContainerProps {}

interface Point {
    latitude: number;
    longitude: number;
    zoom: number;
}

const ExploreContainer: React.FC<ContainerProps> = () => {
    const puntos = [
        {
            latitude: 11.232024,
            longitude: -74.199805,
            nombre: 'Ocean Mall',
        },
        { latitude: 11.227931, longitude: -74.17257, nombre: 'Buena vista' },
        {
            latitude: 11.234355,
            longitude: -74.177125,
            nombre: 'Clínica los nogales',
        },
        {
            latitude: 11.239942,
            longitude: -74.181132,
            nombre: 'Olimpica av. del libertador',
        },
        {
            latitude: 11.238293,
            longitude: -74.212313,
            nombre: 'Kia Fujiyama',
        },
        {
            latitude: 11.19718,
            longitude: -74.189283,
            nombre: 'Zona Franca',
        },
        {
            latitude: 11.221661,
            longitude: -74.173054,
            nombre: 'Antonio nariño',
        },
    ];

    const { Geolocation } = Plugins;

    const [viewPort, setViewPort] = useState<Point>({
        latitude: 0,
        longitude: 0,
        zoom: 0,
    });

    const [marker, setMarker] = useState<Point>({
        latitude: 0,
        longitude: 0,
        zoom: 0,
    });

    useEffect(() => {
        (async () => {
            await getPosition();
        })();
    }, [marker]);

    const [data, setData] = useState({
        type: 'geojson',
        data: {
            type: 'Feature',
            properties: {},
            geometry: {
                type: 'LineString',
                coordinates: [],
            },
        },
    });

    const [marcadores, setMarcadores] = useState([]);

    const [called, setCalled] = useState(false);

    const distanciasCalc = (array: any, actual: any, resultado: any = []) => {
        let index;
        if (array.length > 0) {
            let menor = {
                distancia: haversineDistance(actual, array[0], false) + 10,
                index: '',
            };
            for (let i in array) {
                const distancia = haversineDistance(actual, array[i], false);
                if (distancia < menor.distancia)
                    menor = { distancia, index: i };
            }
            index = array[Number(menor.index)];
            resultado.push({ ...index });
            array.splice(Number(menor.index), 1);
            distanciasCalc(array, index, resultado);
        }
        return resultado;
    };

    const direction = async () => {
        const resultados = await distanciasCalc(puntos, marker);
        let url = 'https://api.mapbox.com/directions/v5/mapbox/driving/';
        setMarcadores(resultados);
        url += `${marker.longitude},${marker.latitude};`;
        for (let resultado of resultados) {
            url += `${resultado.longitude},${resultado.latitude};`;
        }
        url = url.substring(0, url.length - 1);
        url += `?access_token=${key}&geometries=geojson&overview=full`;
        const {
            data: { routes },
        } = await axios.get(url);
        const {
            geometry: { coordinates },
        } = routes[0];
        const data = {
            type: 'Feature',
            properties: {},
            geometry: {
                type: 'LineString',
                coordinates,
            },
        };
        setData({ type: 'geojson', data });
    };

    const haversineDistance = (
        coords1: any,
        coords2: any,
        isMiles: Boolean
    ) => {
        function toRad(x: number) {
            return (x * Math.PI) / 180;
        }

        var lon1 = coords1.longitude;
        var lat1 = coords1.latitude;

        var lon2 = coords2.longitude;
        var lat2 = coords2.latitude;

        var R = 6371; // km

        var x1 = lat2 - lat1;
        var dLat = toRad(x1);
        var x2 = lon2 - lon1;
        var dLon = toRad(x2);
        var a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRad(lat1)) *
                Math.cos(toRad(lat2)) *
                Math.sin(dLon / 2) *
                Math.sin(dLon / 2);
        var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        var d = R * c;

        if (isMiles) d /= 1.60934;

        return d;
    };

    const getPosition = async () => {
        if (!called) {
            const {
                coords: { latitude, longitude },
            } = await Geolocation.getCurrentPosition();
            setViewPort({ latitude, longitude, zoom: 15 });

            setMarker({ latitude, longitude, zoom: 15 });
            if (marker.latitude) direction();
            setCalled(true);
        }
    };

    const Map = ReactMapboxGl({
        accessToken: key,
    });

    const markers = marcadores.map((marcador: any, i) => (
        <Fragment key={i}>
            <Popup coordinates={[marcador.longitude, marcador.latitude]}>
                <img
                    alt="marker"
                    src={`https://dummyimage.com/20x20/000/fff&text=${i + 1}`}
                />
            </Popup>
            <Marker
                anchor="bottom"
                key={i}
                coordinates={[marcador.longitude, marcador.latitude]}
            >
                <p>{marcador.nombre}</p>
            </Marker>
        </Fragment>
    ));

    return (
        <Map
            center={[viewPort.longitude, viewPort.latitude]}
            zoom={[13]}
            style="mapbox://styles/mapbox/streets-v11"
            containerStyle={{
                height: '100%',
                width: '100%',
            }}
        >
            <Fragment>
                <Source id="ruta" geoJsonSource={data} />
                <Image id={'arrow'} url={"https://i.imgur.com/LcIng3L.png"} />
                <Layer
                    id="linea"
                    type="line"
                    sourceId="ruta"
                    layout={{
                        'line-cap': 'round' as 'round',
                        'line-join': 'round' as 'round',
                    }}
                    paint={{
                        'line-color': '#4790E5',
                        'line-width': 3,
                    }}
                />
                <Layer
                    id="arrows"
                    type="symbol"
                    sourceId="ruta"
                    layout={{
                        'symbol-placement': 'line',
                        'symbol-spacing': 1,
                        'icon-allow-overlap': true,
                        'icon-image': 'arrow',
                        'icon-size': 0.06,
                        visibility: 'visible',
                    }}
                />
                <Popup coordinates={[marker.longitude, marker.latitude]}>
                    <p>Yo</p>
                </Popup>
                <Marker coordinates={[marker.longitude, marker.latitude]}>
                    <PersonPinCircleIcon />
                </Marker>
                {markers}
            </Fragment>
        </Map>
    );
};

export default ExploreContainer;

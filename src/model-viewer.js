import * as THREE from 'three';
import React, { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from "@react-three/fiber";
import { useHelper } from '@react-three/drei';

const Light = () => {
  const lightRef = useRef();
  useHelper(lightRef, THREE.DirectionalLightHelper, 1);
/* 
  <directionalLight 
  ref={lightRef}
  castShadow
  position={[0, 10, 10]}
  intensity={1.5 }
  shadow-mapSize-width={1024}
  shadow-mapSize-height={1024}
  shadow-camera-far={50}
  shadow-camera-left={-10}
  shadow-camera-right={10}
  shadow-camera-bottom={-10}
/>
 */
return (
    <>
      <ambientLight intensity={0.9}/>
      <pointLight position={[-10, 0, -20]} intensity='.5' />
      <pointLight position={[0, -10, 0]} intensity='1.5' />
    </>
  );
}


const ModelViewer = ({onSelectClick}) => {
  const tetrahedron = new THREE.TetrahedronBufferGeometry(1);

  const xRot = Math.atan(1 / Math.sqrt(2));
  const yRot = 2 * Math.PI / 8;
  const zRot = /*Math.PI/2*/0;
  const position = [0, 0, -10];
  const fireColor = new THREE.Color(/*1, 0, 0*/0x330000);
  const baseColor = new THREE.Color(/*color*/0x144414);
  const normalOpacity = 0.3;
  const mesh1Ref = useRef();
/*
  useEffect(() => {
    mesh1Ref.current.opacity = normalOpacity;
    mesh1Ref.current.color = fireColor;
  }, []);
*/  
  
  return (
    <Canvas shadows colorManagement camera={{position: [-10, 15, -15], near: 30, far: 55, fov: 12}}>
      <Light />
      <mesh position={[-10, 15, -20]} >
        <mesh castShadow geometry={tetrahedron} rotation={[-xRot, zRot, yRot]}>
          <meshStandardMaterial attach='material' color={baseColor} opacity={normalOpacity} ref={mesh1Ref} />
        </mesh>
      </mesh>
    </Canvas>
  );
}
/* 
<mesh castShadow geometry={tetrahedron} rotation={[-xRot, -zRot, yRot]}>
<meshStandardMaterial attach='material' color={baseColor} opacity={normalOpacity} transparent ref={mesh2Ref} />
</mesh>
 */
export { ModelViewer };

import React, { useRef, useState, useEffect, Suspense, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import {
  Physics,
  usePlane,
  useBox,
  useConvexPolyhedron,
} from '@react-three/cannon';
import {
  Environment,
  OrbitControls,
  useTexture,
  PerspectiveCamera,
  Text,
} from '@react-three/drei';
import {
  EffectComposer,
  Bloom,
  ChromaticAberration,
  DepthOfField,
} from '@react-three/postprocessing';
import * as THREE from 'three';
import { BlendFunction } from 'postprocessing';
import { ConvexGeometry } from 'three-stdlib';

/*
 * функция для создания нерегулярной геометрии осколка
 */
const createShardGeometry = (size, complexity = 6) => {
  // Создаем базовую форму осколка как неправильный выпуклый многогранник
  const points = [];

  // Базовая форма - неправильный треугольник с вариациями
  const baseWidth = size[0] * (0.5 + Math.random() * 0.5);
  const baseHeight = size[1] * (0.5 + Math.random() * 0.5);
  const baseDepth = size[2] * (0.7 + Math.random() * 0.3);

  // Создаем несколько точек для формирования неровной формы
  for (let i = 0; i < complexity; i++) {
    const angle = (i / complexity) * Math.PI * 2;
    const radius = 0.4 + Math.random() * 0.6; // Случайное изменение радиуса для неровности

    const x = Math.cos(angle) * baseWidth * radius;
    const y = Math.sin(angle) * baseHeight * radius;
    // Разная высота для создания неровностей
    const z1 = (Math.random() * 0.4 - 0.2) * baseDepth;
    const z2 = (Math.random() * 0.4 - 0.2) * baseDepth;

    // Добавляем точки с обеих сторон для создания толщины
    points.push(new THREE.Vector3(x, y, z1));
    points.push(new THREE.Vector3(x, y, z2));

    // Добавляем несколько промежуточных точек для более сложной формы
    if (Math.random() > 0.5) {
      const subAngle = angle + (Math.random() * 0.2 - 0.1);
      const subRadius = radius * (0.7 + Math.random() * 0.3);
      points.push(
        new THREE.Vector3(
          Math.cos(subAngle) * baseWidth * subRadius,
          Math.sin(subAngle) * baseHeight * subRadius,
          (Math.random() * 0.4 - 0.2) * baseDepth
        )
      );
    }
  }

  // Создаем выпуклую оболочку из этих точек
  return new ConvexGeometry(points);
};

// Компонент осколка стекла с улучшенной геометрией
const GlassShard = ({ position, rotation, size, velocity, index }) => {
  // Создаем геометрию осколка
  const geometry = useMemo(
    () => createShardGeometry(size, 5 + Math.floor(Math.random() * 4)),
    [size]
  );

  // Преобразуем геометрию в формат, подходящий для физического движка
  const [positions, normals] = useMemo(() => {
    const positions = geometry.attributes.position.array;
    const normals = geometry.attributes.normal.array;
    const vertices = [];

    for (let i = 0; i < positions.length; i += 3) {
      vertices.push([positions[i], positions[i + 1], positions[i + 2]]);
    }

    return [
      vertices,
      Array.from({ length: vertices.length / 3 }, () => [0, 0, 0]),
    ];
  }, [geometry]);

  // Используем convex polyhedron для физической симуляции
  const [ref, api] = useConvexPolyhedron(() => ({
    mass: 0.1 + Math.random() * 0.2, // Варьируем массу для более реалистичного поведения
    position,
    rotation,
    args: [positions, normals],
    linearDamping: 0.92 + Math.random() * 0.05, // Случайное затухание
    angularDamping: 0.92 + Math.random() * 0.05,
    velocity,
    material: {
      friction: 0.2,
      restitution: 0.8, // Высокая упругость для стекла
    },
  }));

  // Создаем материал для осколка с реалистичными свойствами стекла
  const glassMaterial = useMemo(() => {
    return new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(0xffffff),
      metalness: 0.1,
      roughness: 0.05 + Math.random() * 0.03, // Легкая вариация шероховатости
      transmission: 0.95, // Прозрачность
      thickness: 0.5, // Толщина для преломления
      envMapIntensity: 1,
      clearcoat: 1,
      clearcoatRoughness: 0.1,
      ior: 1.5, // Индекс преломления стекла
      specularIntensity: 1,
      specularColor: new THREE.Color(0xffffff),
      reflectivity: 0.5,
      transparent: true,
      // Устанавливаем opacity в 1, чтобы не смешивать обычный альфа-канал с transmission
      opacity: 1,
      // Отключаем запись в буфер глубины для предотвращения артефактов сортировки
      depthWrite: false,
      // Дополнительные параметры для легкого цветового оттенка (опционально)
      attenuationColor: new THREE.Color(0xfafeff),
      attenuationDistance: 5 + Math.random() * 5,
    });
  }, []);

  // Эффект остановки и стабилизации осколков
  useEffect(() => {
    const stopTime = 800 + Math.random() * 1200;

    const stopTimeout = setTimeout(() => {
      api.velocity.set(0, 0, 0);
      api.angularVelocity.set(0, 0, 0);
    }, stopTime);

    return () => clearTimeout(stopTimeout);
  }, [api]);

  // Добавляем тонкое "дрожание" для визуального эффекта зависших осколков
  useFrame((state) => {
    if (ref.current && state.clock.elapsedTime > 2 && Math.random() > 0.96) {
      const intensity = 0.0015 * Math.max(0, 1 - index / 50); // Осколки с меньшими индексами колеблются сильнее

      api.applyImpulse(
        [
          (Math.random() - 0.5) * intensity,
          (Math.random() - 0.5) * intensity,
          (Math.random() - 0.5) * intensity,
        ],
        [0, 0, 0]
      );
    }
  });

  return (
    <mesh
      ref={ref}
      material={glassMaterial}
      castShadow
      receiveShadow
      geometry={geometry}
    />
  );
};

// Генератор случайных осколков
const BrokenGlass = ({
  count = 50,
  explosionForce = 3,
  explosionRadius = 1.2,
}) => {
  const shards = useMemo(() => {
    const shardsArray = [];

    for (let i = 0; i < count; i++) {
      // Размер осколка - ближе к центру более крупные осколки
      const sizeBase = 0.1 + Math.random() * 0.15;
      const sizeFactor = Math.max(0.5, 1 - (i / count) * 0.5); // Крупные в начале, мелкие в конце

      const size = [
        sizeBase * sizeFactor * (0.8 + Math.random() * 0.4),
        sizeBase * sizeFactor * (0.8 + Math.random() * 0.4),
        0.02 + Math.random() * 0.01, // Толщина стекла
      ];

      // Распределение осколков - по спирали для более естественного разлета
      const angleStep = 2.4; // ~137.5 градусов - золотой угол для равномерного распределения
      const angle = i * angleStep;
      const radiusFactor = Math.sqrt(i / count); // Квадратный корень для равномерного заполнения
      const radius =
        explosionRadius * radiusFactor * (0.2 + Math.random() * 0.8);

      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      const z = (Math.random() - 0.5) * 0.2;

      // Случайное вращение
      const rotation = [
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2,
      ];

      // Начальная скорость - взрыв от центра с небольшими вариациями
      const distanceFromCenter = Math.sqrt(x * x + y * y + z * z);
      const forceFactor =
        explosionForce *
        (1 - Math.min(1, distanceFromCenter / explosionRadius) * 0.5);

      const velocity = [
        x * forceFactor * (0.8 + Math.random() * 0.4),
        y * forceFactor * (0.8 + Math.random() * 0.4),
        z * forceFactor * (0.8 + Math.random() * 0.4) + Math.random() * 0.5, // Добавляем случайное движение вверх
      ];

      shardsArray.push(
        <GlassShard
          key={i}
          position={[x, y, z]}
          rotation={rotation}
          size={size}
          velocity={velocity}
          index={i}
        />
      );
    }

    return shardsArray;
  }, [count, explosionForce, explosionRadius]);

  return <>{shards}</>;
};

// Основная сцена
const GlassScene = () => {
  return (
    <Canvas shadows dpr={[1, 2]} className="w-full h-full">
      <PerspectiveCamera makeDefault position={[0, 0, 3]} fov={45} />
      <color attach="background" args={['#151520']} />

      <ambientLight intensity={0.2} />
      <spotLight
        position={[5, 5, 5]}
        angle={0.15}
        penumbra={1}
        intensity={1}
        castShadow
        shadow-mapSize={[2048, 2048]}
      />
      {/* <pointLight position={[-5, -5, -5]} intensity={0.5} /> */}
      <pointLight position={[-5, -5, -5]} intensity={0.5} />
      <pointLight position={[5, -5, 5]} intensity={0.5} color="#ffcc77" />

      <Suspense fallback={null}>
        <Physics gravity={[0, 0, 0]}>
          <BrokenGlass count={15} />
        </Physics>

        {/* Текст, расположенный позади стеклянных осколков */}
        <Text
          position={[0, 0, -1]}
          fontSize={0.5}
          color="white"
          maxWidth={4}
          lineHeight={1}
          letterSpacing={0.15}
          textAlign="center"
          anchorX="center"
          anchorY="middle"
        >
          FULLSTACK DEVELOPER
        </Text>

        <Environment preset="apartment" />
      </Suspense>

      <EffectComposer>
        <Bloom
          intensity={0.4}
          luminanceThreshold={0.2}
          luminanceSmoothing={0.5}
          height={300}
        />

        <ChromaticAberration
          offset={[0.0005, 0.0005]}
          blendFunction={BlendFunction.LIGHTEN}
        />
        <DepthOfField
          focusDistance={0}
          focalLength={0.02}
          bokehScale={1.2}
          height={480}
        />
      </EffectComposer>
    </Canvas>
  );
};

export default GlassScene;

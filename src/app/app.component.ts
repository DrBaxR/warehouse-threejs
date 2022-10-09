import { Component, OnInit } from '@angular/core';
import { AmbientLight, AxesHelper, BackSide, BoxGeometry, BufferGeometry, DirectionalLight, Material, Mesh, MeshBasicMaterial, MeshPhongMaterial, PerspectiveCamera, PlaneGeometry, PointLight, Quaternion, Raycaster, Scene, TextureLoader, Vector2, Vector3, WebGLRenderer } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

class SceneObject {
  private geometry: BufferGeometry;
  private material: Material;
  private mesh: Mesh;

  constructor(geometry: BufferGeometry, material: Material) {
    this.geometry = geometry;
    this.material = material;
    this.mesh = new Mesh(geometry, material);
  }

  getMesh(): Mesh {
    return this.mesh;
  }



  rotate(amount: Vector3) {
    // this.geometry.rotateX(- Math.PI / 2);
    this.geometry.rotateX(amount.x);
    this.geometry.rotateY(amount.y);
    this.geometry.rotateZ(amount.z);
  }

  move(position: Vector3) {
    this.geometry.translate(position.x, position.y, position.z);
  }
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'angular-threejs';

  private scene = new Scene();
  private camera = new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  private renderer = new WebGLRenderer({ antialias: true });

  private raycaster = new Raycaster();
  private pointer = new Vector2();

  private intersectCubeShown = false;
  private intersectCube = new SceneObject(new BoxGeometry(0.5, 0.3, 0.1), new MeshPhongMaterial({ color: 0x00ff00 }))

  ngOnInit() {
    this.setupScene();

    const cube = new SceneObject(new BoxGeometry(2, 1, 3), new MeshPhongMaterial({ color: 0xcdcdcd }));
    this.scene.add(cube.getMesh());

    const plane = new SceneObject(new PlaneGeometry(10000, 10000), new MeshPhongMaterial({ color: 0xffffff}));
    plane.rotate(new Vector3(- Math.PI / 2, 0, 0));
    plane.move(new Vector3(0, -0.5, 0));
    // this.scene.add(plane.getMesh())

    const initialFront = new Vector3(0, 0, 1); // of the intersect cube

    const animate = () => {
      requestAnimationFrame(animate);

      this.raycaster.setFromCamera(this.pointer, this.camera);
      const intersects = this.raycaster.intersectObjects([cube.getMesh()]);
      if (intersects[0]) {
        const intersectNormal = intersects[0].face?.normal;
        const intersectPosition = intersects[0].point;
        this.intersectCube.getMesh().position.set(intersectPosition.x, intersectPosition.y, intersectPosition.z);
        // rotate the cube so its Z axis is aligned with the normal of the face
        this.intersectCube.getMesh().setRotationFromQuaternion(new Quaternion().setFromUnitVectors(initialFront, intersectNormal!));
        
        if (!this.scene.children.includes(this.intersectCube.getMesh())) {
          this.scene.add(this.intersectCube.getMesh());
          this.intersectCubeShown = true;
        }
      } else {
        this.scene.remove(this.intersectCube.getMesh());
        this.intersectCubeShown = false;
      }

      this.renderer.render(this.scene, this.camera);
    }

    animate();
  }

  private onPointerMove = (event: any) => {
    this.pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
  }
  
  private onClick = (_event: any) => {
    if (this.intersectCubeShown) {
      const newObject = this.intersectCube.getMesh().clone();
      newObject.material = new MeshPhongMaterial({ color: 0x555555 });

      this.scene.add(newObject);
    }
  }

  private setupScene() {
    this.camera.position.set(2.5, 2.5, 5)

    const directionalLight = new DirectionalLight(0xffffff, 0.75);
    directionalLight.position.set(-5, -2.5, -3);
    const pointLight = new PointLight(0xffffff, 1);
    pointLight.position.set(5, 10, 5);
    const ambientLight = new AmbientLight(0xffffff, 0.1);

    this.scene.add(pointLight);
    this.scene.add(directionalLight);
    this.scene.add(ambientLight);

    this.renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(this.renderer.domElement);

    const controls = new OrbitControls(this.camera, this.renderer.domElement) // controls.update() must be called every time the position of the camera is modified externally

    window.addEventListener('pointermove', this.onPointerMove);
    window.addEventListener('click', this.onClick);

    this.setupSkybox();
    // this.setupDebug();
  }

  private setupSkybox() {
    const materialArray = [];
    const texture_ft = new TextureLoader().load('assets/sb_ft.jpg');
    const texture_bk = new TextureLoader().load('assets/sb_bk.jpg');
    const texture_up = new TextureLoader().load('assets/sb_up.jpg');
    const texture_dn = new TextureLoader().load('assets/sb_dn.jpg');
    const texture_rt = new TextureLoader().load('assets/sb_rt.jpg');
    const texture_lf = new TextureLoader().load('assets/sb_lf.jpg');

    materialArray.push(new MeshBasicMaterial({ map: texture_ft }));
    materialArray.push(new MeshBasicMaterial({ map: texture_bk }));
    materialArray.push(new MeshBasicMaterial({ map: texture_up }));
    materialArray.push(new MeshBasicMaterial({ map: texture_dn }));
    materialArray.push(new MeshBasicMaterial({ map: texture_rt }));
    materialArray.push(new MeshBasicMaterial({ map: texture_lf }));

    materialArray.forEach(mat => mat.side = BackSide);

    const skyboxGeo = new BoxGeometry(1000, 1000, 1000);
    const skybox = new Mesh(skyboxGeo, materialArray);
    this.scene.add(skybox);

  }

  private setupDebug() {
    const axesHelper = new AxesHelper(5);
    this.scene.add(axesHelper);
  }
}

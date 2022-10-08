import { Component, OnInit } from '@angular/core';
import { BoxGeometry, BufferGeometry, DirectionalLight, Material, Mesh, MeshPhongMaterial, PerspectiveCamera, PointLight, Raycaster, Scene, Vector2, WebGLRenderer } from 'three';
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
  private renderer = new WebGLRenderer();

  private raycaster = new Raycaster();
  private pointer = new Vector2();

  ngOnInit() {
    this.setupScene();

    const cube = new SceneObject(new BoxGeometry(2, 1, 3), new MeshPhongMaterial({ color: 0xefefef }));
    this.scene.add(cube.getMesh());

    // TODO: on click add a new item to the 'warehouse'
    const intersectCube = new SceneObject(new BoxGeometry(0.1, 0.1, 0.1), new MeshPhongMaterial({ color: 0x00ff00 }));

    const animate = () => {
      requestAnimationFrame(animate);

      this.raycaster.setFromCamera(this.pointer, this.camera);
      const intersects = this.raycaster.intersectObjects([cube.getMesh()]);
      if (intersects[0]) {
        const intersectPosition = intersects[0].point;
        intersectCube.getMesh().position.set(intersectPosition.x, intersectPosition.y, intersectPosition.z);
        
        if (!this.scene.children.includes(intersectCube.getMesh())) {
          this.scene.add(intersectCube.getMesh());
        }
      } else {
        this.scene.remove(intersectCube.getMesh());
      }

      this.renderer.render(this.scene, this.camera);
    }

    animate();
  }

  private onPointerMove = (event: any) => {
    this.pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
  }

  private setupScene() {
    this.camera.position.set(2.5, 2.5, 5)

    const directionalLight = new DirectionalLight(0xffffff, 0.75);
    directionalLight.position.set(-5, -2.5, -3);
    const pointLight = new PointLight(0xffffff, 1);
    pointLight.position.set(5, 5, 5);

    this.scene.add(pointLight);
    this.scene.add(directionalLight);

    this.renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(this.renderer.domElement);

    const controls = new OrbitControls(this.camera, this.renderer.domElement)

    window.addEventListener('pointermove', this.onPointerMove);
  }
}

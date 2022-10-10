import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';
import { GUI } from 'dat.gui';
import { Scene, PerspectiveCamera, WebGLRenderer, Raycaster, Vector2, BoxGeometry, MeshPhongMaterial, Vector3, Quaternion, DirectionalLight, PointLight, AmbientLight, TextureLoader, MeshBasicMaterial, BackSide, Mesh, AxesHelper, Object3D, SphereGeometry } from 'three';
import { CSG } from 'three-csg-ts';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

@Component({
  selector: 'app-builder',
  templateUrl: './builder.component.html',
  styleUrls: ['./builder.component.css']
})
export class BuilderComponent implements AfterViewInit {

  @ViewChild('canvas') canvasEl!: ElementRef

  private debugOptions = {
    showDebug: false,
    showSkybox: true,
  };
  private axesHelper!: AxesHelper;
  private skybox!: Object3D;

  private scene = new Scene();
  private camera = new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  private renderer!: WebGLRenderer

  private raycaster = new Raycaster();
  private pointer = new Vector2();

  private intersectCubeShown = false;
  private intersectCube = new Mesh(new BoxGeometry(0.5, 0.3, 0.1), new MeshPhongMaterial({ color: 0x00ff00 }))

  ngAfterViewInit(): void {
    this.setupScene();
    // this.setupGUI();
    this.addCsgDemo();

    const cube = new Mesh(new BoxGeometry(2, 1, 3), new MeshPhongMaterial({ color: 0xcdcdcd }));
    this.scene.add(cube);

    // const plane = new Mesh(new PlaneGeometry(10000, 10000), new MeshPhongMaterial({ color: 0xffffff}));
    // plane.rotate(new Vector3(- Math.PI / 2, 0, 0));
    // plane.move(new Vector3(0, -0.5, 0));
    // this.scene.add(plane.getMesh())

    const initialFront = new Vector3(0, 0, 1); // of the intersect cube

    const animate = () => {
      requestAnimationFrame(animate);

      this.raycaster.setFromCamera(this.pointer, this.camera);
      const intersects = this.raycaster.intersectObjects([cube]);
      if (intersects[0]) {
        const intersectNormal = intersects[0].face?.normal;
        const intersectPosition = intersects[0].point;
        this.intersectCube.position.set(intersectPosition.x, intersectPosition.y, intersectPosition.z);
        // rotate the cube so its Z axis is aligned with the normal of the face
        this.intersectCube.setRotationFromQuaternion(new Quaternion().setFromUnitVectors(initialFront, intersectNormal!));

        if (!this.scene.children.includes(this.intersectCube)) {
          this.scene.add(this.intersectCube);
          this.intersectCubeShown = true;
        }
      } else {
        this.scene.remove(this.intersectCube);
        this.intersectCubeShown = false;
      }

      this.renderer.render(this.scene, this.camera);
    }

    animate();
  }

  onPointerMove(event: any) {
    const canvas = this.canvasEl.nativeElement as HTMLCanvasElement

    this.pointer.x = (event.offsetX / canvas.clientWidth) * 2 - 1;
    this.pointer.y = -(event.offsetY / canvas.clientHeight) * 2 + 1;
  }

  onClick(_event: any) {
    if (this.intersectCubeShown) {
      const newObject = this.intersectCube.clone();
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

    const canvas = this.canvasEl.nativeElement as HTMLCanvasElement;
    this.renderer = new WebGLRenderer({ canvas, antialias: true });
    this.renderer.setSize(canvas.clientWidth, canvas.clientHeight);

    const controls = new OrbitControls(this.camera, this.renderer.domElement) // controls.update() must be called every time the position of the camera is modified externally

    this.setupSkybox();
    this.setupDebug();
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
    this.skybox = new Mesh(skyboxGeo, materialArray);
    this.scene.add(this.skybox);

  }

  private setupDebug() {
    this.axesHelper = new AxesHelper(5);
  }

  private setupGUI() {
    const gui = new GUI({ name: 'GUI test' });
    gui.add(this.debugOptions, 'showDebug').onChange((val) => {
      if (val) {
        this.scene.add(this.axesHelper);
      } else {
        this.scene.remove(this.axesHelper);
      }

    });

    gui.add(this.debugOptions, 'showSkybox').onChange((val) => {
      if (val) {
        this.scene.add(this.skybox);
      } else {
        this.scene.remove(this.skybox);
      }
    })
  }

  // solves the extrusion problem
  private addCsgDemo() {
    const box = new Mesh(
      new BoxGeometry(2, 2, 2),
      new MeshPhongMaterial({ color: 0xffffff }),
    )
    box.position.set(3, 0, 3);

    const sphere = new Mesh(
      new SphereGeometry(1.2, 20, 20),
      new MeshPhongMaterial({ color: 0xffffff }),
    );
    sphere.position.set(3, 0, 3);

    const res = CSG.subtract(box, sphere);
    res.position.set(-3, 0, 3);

    this.scene.add(res)

    this.scene.add(box);
    this.scene.add(sphere);
  }
}

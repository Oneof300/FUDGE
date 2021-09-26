///<reference path="ComponentJointAxial.ts"/>
namespace FudgeCore {
  /**
     * A physical connection between two bodies with a defined axe of rotation and rotation. Two Degrees of Freedom in the defined axis.
     * Two RigidBodies need to be defined to use it. A motor can be defined for rotation and translation, along with spring settings.
     * 
     * ```plaintext
     *          JointHolder - attachedRigidbody
     *                    ----------  ↑
     *                    |        |  |
     *          <---------|        |--------------> connectedRigidbody, sliding on one Axis, 1st Degree of Freedom
     *                    |        |  |   
     *                    ----------  ↓ rotating on one Axis, 2nd Degree of Freedom   
     * ```
     * 
     * @author Marko Fehrenbach, HFU 2020
   */
  export class ComponentJointCylindrical extends ComponentJointAxial {
    public static readonly iSubclass: number = Component.registerSubclass(ComponentJointCylindrical);
    protected joint: OIMO.CylindricalJoint;
    protected config: OIMO.CylindricalJointConfig = new OIMO.CylindricalJointConfig();
    protected motor: OIMO.TranslationalLimitMotor;

    //Internal Variables
    protected jointRotationSpringDampingRatio: number = 0;
    protected jointRotationSpringFrequency: number = 0;

    private jointMotorForce: number = 0;

    private jointRotationMotorLimitUpper: number = 360;
    private jointRotationMotorLimitLower: number = 0;
    private jointRotationMotorTorque: number = 0;
    private jointRotationMotorSpeed: number = 0;


    private rotationalMotor: OIMO.RotationalLimitMotor;
    private rotationSpringDamper: OIMO.SpringDamper;

    /** Creating a cylindrical joint between two ComponentRigidbodies moving on one axis and rotating around another bound on a local anchorpoint. */
    constructor(_bodyAnchor: ComponentRigidbody = null, _bodyTied: ComponentRigidbody = null, _axis: Vector3 = new Vector3(0, 1, 0), _localAnchor: Vector3 = new Vector3(0, 0, 0)) {
      super(_bodyAnchor, _bodyTied, _axis, _localAnchor);
    }

    //#region Get/Set transfor of fudge properties to the physics engine

    /**
     * The damping of the spring. 1 equals completly damped.
     */
    public set springDamping(_value: number) {
      super.springDamping = _value;
      if (this.joint != null) this.joint.getTranslationalSpringDamper().dampingRatio = _value;
    }

    /**
     * The frequency of the spring in Hz. At 0 the spring is rigid, equals no spring. The smaller the value the less restrictive is the spring.
    */
    public set springFrequency(_value: number) {
      super.springFrequency = _value;
      if (this.joint != null) this.joint.getTranslationalSpringDamper().frequency = _value;
    }

    /**
    * The damping of the spring. 1 equals completly damped. Influencing TORQUE / ROTATION
    */
    get rotationSpringDamping(): number {
      return this.jointRotationSpringDampingRatio;
    }
    set rotationSpringDamping(_value: number) {
      this.jointRotationSpringDampingRatio = _value;
      if (this.joint != null) this.joint.getRotationalSpringDamper().dampingRatio = this.jointRotationSpringDampingRatio;
    }

    /**
     * The frequency of the spring in Hz. At 0 the spring is rigid, equals no spring. Influencing TORQUE / ROTATION
    */
    get rotationSpringFrequency(): number {
      return this.jointRotationSpringFrequency;
    }
    set rotationSpringFrequency(_value: number) {
      this.jointRotationSpringFrequency = _value;
      if (this.joint != null) this.joint.getRotationalSpringDamper().frequency = this.jointRotationSpringFrequency;
    }


    /**
      * The Upper Limit of movement along the axis of this joint. The limiter is disable if lowerLimit > upperLimit. Axis-Angle measured in Degree.
     */
    get rotationalMotorLimitUpper(): number {
      return this.jointRotationMotorLimitUpper * 180 / Math.PI;
    }
    set rotationalMotorLimitUpper(_value: number) {
      this.jointRotationMotorLimitUpper = _value * Math.PI / 180;
      if (this.joint != null) this.joint.getRotationalLimitMotor().upperLimit = this.jointRotationMotorLimitUpper;
    }
    /**
      * The Lower Limit of movement along the axis of this joint. The limiter is disable if lowerLimit > upperLimit. Axis Angle measured in Degree.
     */
    get rotationalMotorLimitLower(): number {
      return this.jointRotationMotorLimitLower * 180 / Math.PI;
    }
    set rotationalMotorLimitLower(_value: number) {
      this.jointRotationMotorLimitLower = _value * Math.PI / 180;
      if (this.joint != null) this.joint.getRotationalLimitMotor().lowerLimit = this.jointRotationMotorLimitLower;
    }
    /**
      * The target rotational speed of the motor in m/s. 
     */
    get rotationalMotorSpeed(): number {
      return this.jointRotationMotorSpeed;
    }
    set rotationalMotorSpeed(_value: number) {
      this.jointRotationMotorSpeed = _value;
      if (this.joint != null) this.joint.getRotationalLimitMotor().motorSpeed = this.jointRotationMotorSpeed;
    }
    /**
      * The maximum motor torque in Newton. force <= 0 equals disabled. 
     */
    get motorTorque(): number {
      return this.jointRotationMotorTorque;
    }
    set motorTorque(_value: number) {
      this.jointRotationMotorTorque = _value;
      if (this.joint != null) this.joint.getRotationalLimitMotor().motorTorque = this.jointRotationMotorTorque;
    }

    /**
      * The Upper Limit of movement along the axis of this joint. The limiter is disable if lowerLimit > upperLimit. 
     */
    public set motorLimitUpper(_value: number) {
      super.motorLimitUpper = _value;
      if (this.joint != null)
        this.joint.getTranslationalLimitMotor().upperLimit = _value;
    }
    /**
      * The Lower Limit of movement along the axis of this joint. The limiter is disable if lowerLimit > upperLimit. 
     */
    public set motorLimitLower(_value: number) {
      super.motorLimitLower = _value;
      if (this.joint != null)
        this.joint.getTranslationalLimitMotor().lowerLimit = _value;
    }

    public set motorSpeed(_value: number) {
      super.motorSpeed = _value;
      if (this.joint != null)
        this.joint.getTranslationalLimitMotor().motorSpeed = super.motorSpeed;
    }
    /**
      * The maximum motor force in Newton. force <= 0 equals disabled. 
     */
    get motorForce(): number {
      return this.jointMotorForce;
    }
    set motorForce(_value: number) {
      this.jointMotorForce = _value;
      if (this.joint != null) this.joint.getTranslationalLimitMotor().motorForce = this.jointMotorForce;
    }

    /**
      * If the two connected RigidBodies collide with eath other. (Default = false)
     */

    //#endregion

    //#region Saving/Loading
    public serialize(): Serialization {
      let serialization: Serialization = {
        motorForce: this.motorForce,
        motorTorque: this.motorTorque,
        rotationalMotorSpeed: this.rotationalMotorSpeed,
        rotationalMotorLimitUpper: this.rotationalMotorLimitUpper,
        rotationalMotorLimitLower: this.rotationalMotorLimitLower,
        rotationSpringDamping: this.rotationSpringDamping,
        rotationSpringFrequency: this.rotationSpringFrequency,
        [super.constructor.name]: super.serialize()
      };
      return serialization;
    }

    public async deserialize(_serialization: Serialization): Promise<Serializable> {
      this.motorForce = _serialization.motorForce || this.motorForce;
      this.motorTorque = _serialization.motorTorque || this.motorTorque;
      this.rotationalMotorSpeed = _serialization.rotationalMotorSpeed || this.rotationalMotorSpeed;
      this.rotationalMotorLimitUpper = _serialization.rotationalMotorLimitUpper || this.rotationalMotorLimitUpper;
      this.rotationalMotorLimitLower = _serialization.rotationalMotorLimitLower || this.rotationalMotorLimitLower;
      this.rotationSpringDamping = _serialization.rotationSpringDamping || this.rotationSpringDamping;
      this.rotationSpringFrequency = _serialization.rotationSpringFrequency || this.rotationSpringFrequency;
      this.springFrequency = _serialization.springFrequency || this.springFrequency;
      super.deserialize(_serialization);
      return this;
    }
    //#endregion

    protected constructJoint(): void {
      this.rotationSpringDamper = new OIMO.SpringDamper().setSpring(this.rotationSpringFrequency, this.rotationSpringDamping);

      this.motor = new OIMO.TranslationalLimitMotor().setLimits(super.motorLimitLower, super.motorLimitUpper);
      this.motor.setMotor(this.motorSpeed, this.motorForce);
      this.rotationalMotor = new OIMO.RotationalLimitMotor().setLimits(this.rotationalMotorLimitLower, this.rotationalMotorLimitUpper);
      this.rotationalMotor.setMotor(this.rotationalMotorSpeed, this.motorTorque);

      this.config = new OIMO.CylindricalJointConfig();
      super.constructJoint();

      this.config.translationalSpringDamper = this.springDamper;
      this.config.translationalLimitMotor = this.motor;
      this.config.rotationalLimitMotor = this.rotationalMotor;
      this.config.rotationalSpringDamper = this.rotationSpringDamper;

      this.joint = new OIMO.CylindricalJoint(this.config);
      this.configureJoint();
    }
  }
}
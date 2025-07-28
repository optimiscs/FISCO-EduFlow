package circuits

import (
	"github.com/consensys/gnark/frontend"
	"github.com/consensys/gnark/std/hash/mimc"
)

// EducationCircuit 学历证明电路
// 证明：我拥有一个由指定学校在指定时间颁发的指定学历证书，
// 其信息摘要包含在给定的Merkle Root中
type EducationCircuit struct {
	// 私有输入（witness）
	StudentID      frontend.Variable `gnark:",secret"`
	School         frontend.Variable `gnark:",secret"`
	Degree         frontend.Variable `gnark:",secret"`
	GraduationYear frontend.Variable `gnark:",secret"`
	GPA            frontend.Variable `gnark:",secret"`
	
	// Merkle证明相关的私有输入
	MerkleProof    []frontend.Variable `gnark:",secret"`
	MerkleIndex    frontend.Variable   `gnark:",secret"`
	
	// 公共输入
	MerkleRoot     frontend.Variable `gnark:",public"`
	MinGPA         frontend.Variable `gnark:",public"`
	RequiredDegree frontend.Variable `gnark:",public"`
	MinYear        frontend.Variable `gnark:",public"`
	
	// 输出（公共）
	IsValid        frontend.Variable `gnark:",public"`
}

// Define 定义电路约束
func (circuit *EducationCircuit) Define(api frontend.API) error {
	// 1. 验证GPA满足最低要求
	gpaValid := api.IsZero(api.Sub(api.Cmp(circuit.GPA, circuit.MinGPA), 1))
	
	// 2. 验证学位类型匹配
	degreeValid := api.IsZero(api.Sub(circuit.Degree, circuit.RequiredDegree))
	
	// 3. 验证毕业年份满足要求
	yearValid := api.IsZero(api.Sub(api.Cmp(circuit.GraduationYear, circuit.MinYear), 1))
	
	// 4. 计算学生信息的哈希
	mimc, _ := mimc.NewMiMC(api)
	mimc.Write(circuit.StudentID)
	mimc.Write(circuit.School)
	mimc.Write(circuit.Degree)
	mimc.Write(circuit.GraduationYear)
	mimc.Write(circuit.GPA)
	studentInfoHash := mimc.Sum()
	
	// 5. 验证Merkle证明
	merkleValid := circuit.verifyMerkleProof(api, studentInfoHash)
	
	// 6. 所有条件都必须满足
	allValid := api.And(gpaValid, degreeValid, yearValid, merkleValid)
	
	// 7. 设置输出
	api.AssertIsEqual(circuit.IsValid, allValid)
	
	return nil
}

// verifyMerkleProof 验证Merkle证明
func (circuit *EducationCircuit) verifyMerkleProof(api frontend.API, leafHash frontend.Variable) frontend.Variable {
	currentHash := leafHash
	currentIndex := circuit.MerkleIndex
	
	// 沿着Merkle路径向上计算
	for i := 0; i < len(circuit.MerkleProof); i++ {
		// 检查当前索引的最低位来决定哈希顺序
		isRight := api.And(currentIndex, 1)
		
		// 创建MiMC哈希器
		mimc, _ := mimc.NewMiMC(api)
		
		// 根据位置决定哈希顺序
		leftHash := api.Select(isRight, circuit.MerkleProof[i], currentHash)
		rightHash := api.Select(isRight, currentHash, circuit.MerkleProof[i])
		
		mimc.Write(leftHash)
		mimc.Write(rightHash)
		currentHash = mimc.Sum()
		
		// 索引右移一位
		currentIndex = api.Div(currentIndex, 2)
	}
	
	// 验证计算出的根是否与给定的根匹配
	return api.IsZero(api.Sub(currentHash, circuit.MerkleRoot))
}

// AgeCircuit 年龄证明电路
// 证明：我的年龄大于等于指定的最小年龄
type AgeCircuit struct {
	// 私有输入
	BirthYear  frontend.Variable `gnark:",secret"`
	BirthMonth frontend.Variable `gnark:",secret"`
	BirthDay   frontend.Variable `gnark:",secret"`
	
	// 公共输入
	MinAge       frontend.Variable `gnark:",public"`
	CurrentYear  frontend.Variable `gnark:",public"`
	CurrentMonth frontend.Variable `gnark:",public"`
	CurrentDay   frontend.Variable `gnark:",public"`
	
	// 输出
	IsOldEnough frontend.Variable `gnark:",public"`
}

// Define 定义年龄证明电路约束
func (circuit *AgeCircuit) Define(api frontend.API) error {
	// 计算当前年龄（简化版本，只考虑年份）
	age := api.Sub(circuit.CurrentYear, circuit.BirthYear)
	
	// 如果还没到生日，年龄减1
	birthdayPassed := circuit.hasBirthdayPassed(api)
	actualAge := api.Select(birthdayPassed, age, api.Sub(age, 1))
	
	// 验证年龄是否满足最低要求
	isOldEnough := api.IsZero(api.Sub(api.Cmp(actualAge, circuit.MinAge), 1))
	
	api.AssertIsEqual(circuit.IsOldEnough, isOldEnough)
	
	return nil
}

// hasBirthdayPassed 检查今年是否已过生日
func (circuit *AgeCircuit) hasBirthdayPassed(api frontend.API) frontend.Variable {
	// 如果当前月份大于出生月份，则已过生日
	monthPassed := api.IsZero(api.Sub(api.Cmp(circuit.CurrentMonth, circuit.BirthMonth), 1))
	
	// 如果月份相同，检查日期
	sameMonth := api.IsZero(api.Sub(circuit.CurrentMonth, circuit.BirthMonth))
	dayPassed := api.IsZero(api.Sub(api.Cmp(circuit.CurrentDay, circuit.BirthDay), 1))
	sameDayOrLater := api.And(sameMonth, dayPassed)
	
	// 月份已过或者同月但日期已过
	return api.Or(monthPassed, sameDayOrLater)
}

// GradeCircuit 成绩证明电路
// 证明：我的GPA高于指定阈值
type GradeCircuit struct {
	// 私有输入
	ActualGPA frontend.Variable `gnark:",secret"`
	Salt      frontend.Variable `gnark:",secret"` // 防止暴力破解的盐值
	
	// 公共输入
	MinGPA         frontend.Variable `gnark:",public"`
	CommittedGPA   frontend.Variable `gnark:",public"` // GPA的承诺值
	
	// 输出
	IsAboveThreshold frontend.Variable `gnark:",public"`
}

// Define 定义成绩证明电路约束
func (circuit *GradeCircuit) Define(api frontend.API) error {
	// 1. 验证GPA承诺
	mimc, _ := mimc.NewMiMC(api)
	mimc.Write(circuit.ActualGPA)
	mimc.Write(circuit.Salt)
	computedCommitment := mimc.Sum()
	
	api.AssertIsEqual(circuit.CommittedGPA, computedCommitment)
	
	// 2. 验证GPA是否高于阈值
	isAbove := api.IsZero(api.Sub(api.Cmp(circuit.ActualGPA, circuit.MinGPA), 1))
	
	api.AssertIsEqual(circuit.IsAboveThreshold, isAbove)
	
	return nil
}

// RangeCircuit 范围证明电路
// 证明：某个私有值在指定范围内
type RangeCircuit struct {
	// 私有输入
	Value frontend.Variable `gnark:",secret"`
	
	// 公共输入
	MinValue frontend.Variable `gnark:",public"`
	MaxValue frontend.Variable `gnark:",public"`
	
	// 输出
	InRange frontend.Variable `gnark:",public"`
}

// Define 定义范围证明电路约束
func (circuit *RangeCircuit) Define(api frontend.API) error {
	// 验证值是否在范围内
	aboveMin := api.IsZero(api.Sub(api.Cmp(circuit.Value, circuit.MinValue), 1))
	belowMax := api.IsZero(api.Sub(api.Cmp(circuit.MaxValue, circuit.Value), 1))
	
	inRange := api.And(aboveMin, belowMax)
	
	api.AssertIsEqual(circuit.InRange, inRange)
	
	return nil
}

// MembershipCircuit 成员资格证明电路
// 证明：某个私有值属于指定集合
type MembershipCircuit struct {
	// 私有输入
	Value frontend.Variable `gnark:",secret"`
	
	// 公共输入（集合元素）
	Set []frontend.Variable `gnark:",public"`
	
	// 输出
	IsMember frontend.Variable `gnark:",public"`
}

// Define 定义成员资格证明电路约束
func (circuit *MembershipCircuit) Define(api frontend.API) error {
	// 检查值是否等于集合中的任何一个元素
	isMember := frontend.Variable(0)
	
	for _, element := range circuit.Set {
		isEqual := api.IsZero(api.Sub(circuit.Value, element))
		isMember = api.Or(isMember, isEqual)
	}
	
	api.AssertIsEqual(circuit.IsMember, isMember)
	
	return nil
}

// GetCircuitByType 根据类型获取电路实例
func GetCircuitByType(circuitType string) frontend.Circuit {
	switch circuitType {
	case "education_proof":
		return &EducationCircuit{
			MerkleProof: make([]frontend.Variable, 10), // 假设最大深度为10
		}
	case "age_proof":
		return &AgeCircuit{}
	case "grade_proof":
		return &GradeCircuit{}
	case "range_proof":
		return &RangeCircuit{}
	case "membership_proof":
		return &MembershipCircuit{
			Set: make([]frontend.Variable, 10), // 假设最大集合大小为10
		}
	default:
		return nil
	}
}

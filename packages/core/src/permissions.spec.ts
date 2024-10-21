import * as sinon from 'sinon'
import * as chai from 'chai'
import { expect } from 'chai'
import * as chaiAsPromised from 'chai-as-promised'
chai.use('default' in chaiAsPromised ? chaiAsPromised.default : chaiAsPromised as any)

import { verifyPermissions } from './permissions.js'
import { NotPermissionedError } from './errors.js'

describe('verifyPermissions', () => {
  let services: any, data: any, session: any

  beforeEach(() => {
    services = {}
    data = {}
    session = {}
  })

  afterEach(() => {
    sinon.restore()
  })

  it('should pass when no permissions are provided', async () => {
    await expect(verifyPermissions({}, services, data, session)).to.be.fulfilled
  })

  it('should pass when a single permission function returns true', async () => {
    const permissions = {
      group1: sinon.stub().resolves(true),
    }

    await expect(verifyPermissions(permissions, services, data, session)).to.be
      .fulfilled
    expect(permissions.group1.calledOnceWith(services, data, session)).to.be
      .true
  })

  it('should pass when all permission functions in an array return true', async () => {
    const permissions = {
      group1: [sinon.stub().resolves(true), sinon.stub().resolves(true)],
    }

    await expect(verifyPermissions(permissions, services, data, session)).to.be
      .fulfilled
    permissions.group1.forEach((func) => {
      expect(func.calledOnceWith(services, data, session)).to.be.true
    })
  })

  it('should fail when a single permission function returns false', async () => {
    const permissions = {
      group1: sinon.stub().resolves(false),
    }

    await expect(
      verifyPermissions(permissions, services, data, session)
    ).to.be.rejectedWith(NotPermissionedError)
  })

  it('should fail when any permission function in an array returns false', async () => {
    const permissions = {
      group1: [sinon.stub().resolves(true), sinon.stub().resolves(false)],
    }

    await expect(
      verifyPermissions(permissions, services, data, session)
    ).to.be.rejectedWith(NotPermissionedError)
  })

  it('should pass if any permission group returns true', async () => {
    const permissions = {
      group1: sinon.stub().resolves(false),
      group2: sinon.stub().resolves(true),
    }

    await expect(verifyPermissions(permissions, services, data, session)).to.be
      .fulfilled
  })

  it('should fail if all permission groups return false', async () => {
    const permissions = {
      group1: sinon.stub().resolves(false),
      group2: sinon.stub().resolves(false),
    }

    await expect(
      verifyPermissions(permissions, services, data, session)
    ).to.be.rejectedWith(NotPermissionedError)
  })
})

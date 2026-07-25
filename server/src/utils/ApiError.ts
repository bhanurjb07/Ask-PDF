class ApiError extends Error{
  statusCode: number;
  errors: unknown[];
  success: boolean;
  data: unknown;

  constructor(statusCode: number, message = "Something went wrong", errors: unknown[] = [], stack = ""){
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.success = false;
    this.data = null;

    if(stack){
      this.stack=stack;
    }else{
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export default ApiError;